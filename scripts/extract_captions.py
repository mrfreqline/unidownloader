import sys
import json
import urllib.request
import re

# Ensure stdout uses UTF-8 to support all languages (Hindi, Japanese, Arabic, etc.)
sys.stdout.reconfigure(encoding='utf-8')

def extract_captions(url, target_lang='auto', target_start=0.0, target_dur=0.0):
    try:
        import yt_dlp
    except ImportError:
        return {"success": False, "error": "yt-dlp is not installed"}

    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return {"success": False, "error": "Could not extract video metadata"}

            auto_subs = info.get('automatic_captions', {}) or {}
            manual_subs = info.get('subtitles', {}) or {}
            all_subs = {**auto_subs, **manual_subs}

            if not all_subs:
                return {"success": False, "error": "No subtitles or auto-captions available for this video"}

            # Auto-detect language or match requested target_lang
            selected_lang = None
            if target_lang and target_lang != 'auto':
                # Try exact match or prefix match (e.g. 'es' matching 'es-419')
                for l in all_subs.keys():
                    if l.lower() == target_lang.lower() or l.lower().startswith(target_lang.lower() + '-'):
                        selected_lang = l
                        break

            if not selected_lang:
                # Prioritize video creator's native language or english / first available
                video_lang = info.get('language')
                if video_lang and video_lang in all_subs:
                    selected_lang = video_lang
                elif 'en' in all_subs:
                    selected_lang = 'en'
                else:
                    selected_lang = list(all_subs.keys())[0]

            formats = all_subs.get(selected_lang, [])
            if not formats:
                return {"success": False, "error": f"No formats found for language: {selected_lang}"}

            # Prioritize json3 (contains millisecond word-level timing offsets)
            json3_fmt = next((f for f in formats if f.get('ext') == 'json3'), None)
            vtt_fmt = next((f for f in formats if f.get('ext') == 'vtt'), None)
            target_fmt = json3_fmt or vtt_fmt or formats[0]
            fmt_url = target_fmt.get('url')

            if not fmt_url:
                return {"success": False, "error": "No timedtext URL available"}

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': '*/*',
            }
            req = urllib.request.Request(fmt_url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as response:
                content = response.read().decode('utf-8', errors='ignore')

            captions = []

            # 1. Parse JSON3
            if target_fmt.get('ext') == 'json3' or content.strip().startswith('{'):
                try:
                    data = json.loads(content)
                    events = data.get('events', [])
                    cap_idx = 0
                    for ev in events:
                        segs = ev.get('segs')
                        if not segs:
                            continue
                        
                        phrase_text = ''.join([s.get('utf8', '') for s in segs]).strip()
                        if not phrase_text or phrase_text == '\n':
                            continue

                        start_sec = ev.get('tStartMs', 0) / 1000.0
                        dur_sec = ev.get('dDurationMs', 2000) / 1000.0
                        end_sec = start_sec + dur_sec

                        # If segment has individual word timing, generate kinetic word-by-word cues
                        has_word_offsets = any(s.get('tOffsetMs') for s in segs if s.get('utf8', '').strip())
                        if has_word_offsets:
                            for s in segs:
                                w_text = s.get('utf8', '').strip()
                                if not w_text or w_text == '\n':
                                    continue
                                offset_sec = s.get('tOffsetMs', 0) / 1000.0
                                w_start = round(start_sec + offset_sec, 2)
                                w_dur = 0.4
                                captions.append({
                                    'id': f'cap_{cap_idx}',
                                    'start': w_start,
                                    'end': round(w_start + w_dur, 2),
                                    'text': w_text,
                                    'word': w_text,
                                })
                                cap_idx += 1
                        else:
                            # Phrase level cue
                            captions.append({
                                'id': f'cap_{cap_idx}',
                                'start': round(start_sec, 2),
                                'end': round(end_sec, 2),
                                'text': phrase_text,
                                'word': phrase_text,
                            })
                            cap_idx += 1
                except Exception as e:
                    return {"success": False, "error": f"Failed to parse json3: {str(e)}"}

            # 2. Parse VTT Fallback
            else:
                lines = content.splitlines()
                cue_pattern = re.compile(r'(\d{2}:\d{2}:\d{2}[\.,]\d{3}|\d{2}:\d{2}[\.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[\.,]\d{3}|\d{2}:\d{2}[\.,]\d{3})')
                cap_idx = 0
                i = 0
                def parse_timestamp(ts):
                    ts = ts.replace(',', '.')
                    parts = ts.split(':')
                    if len(parts) == 3:
                        return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                    elif len(parts) == 2:
                        return float(parts[0]) * 60 + float(parts[1])
                    return 0.0

                while i < len(lines):
                    line = lines[i].strip()
                    m = cue_pattern.search(line)
                    if m:
                        start_sec = parse_timestamp(m.group(1))
                        end_sec = parse_timestamp(m.group(2))
                        i += 1
                        text_lines = []
                        while i < len(lines) and lines[i].strip() and not cue_pattern.search(lines[i]):
                            # Remove tags like <c> or <00:00:19.039>
                            cleaned_cue = re.sub(r'<[^>]+>', '', lines[i]).strip()
                            if cleaned_cue:
                                text_lines.append(cleaned_cue)
                            i += 1
                        txt = ' '.join(text_lines).strip()
                        if txt:
                            captions.append({
                                'id': f'cap_{cap_idx}',
                                'start': round(start_sec, 2),
                                'end': round(end_sec, 2),
                                'text': txt,
                                'word': txt,
                            })
                            cap_idx += 1
                    else:
                        i += 1

            # Filter to requested time range if specified
            if target_dur > 0:
                end_range = target_start + target_dur
                filtered_cues = [
                    c for c in captions
                    if c['start'] >= max(0.0, target_start - 2.0) and c['start'] <= (end_range + 2.0)
                ]
                final_captions = filtered_cues if filtered_cues else captions[:500]
            else:
                final_captions = captions[:2500]

            return {
                "success": True,
                "detectedLanguage": selected_lang,
                "totalCount": len(final_captions),
                "captions": final_captions,
                "provider": "Native Source Auto-Captions (YouTube / TimedText AI)"
            }

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No URL provided"}))
        sys.exit(1)

    url_arg = sys.argv[1]
    lang_arg = sys.argv[2] if len(sys.argv) > 2 else 'auto'
    start_arg = float(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].replace('.','',1).isdigit() else 0.0
    dur_arg = float(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4].replace('.','',1).isdigit() else 0.0

    result = extract_captions(url_arg, lang_arg, target_start=start_arg, target_dur=dur_arg)
    print(json.dumps(result, ensure_ascii=False))
