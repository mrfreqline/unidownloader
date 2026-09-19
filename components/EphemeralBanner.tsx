'use client'

import { ShieldCheck, Trash2, HardDrive, CheckCircle2 } from 'lucide-react'

export default function EphemeralBanner() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Zero-Retention Ephemeral Storage
              </h3>
              <span className="px-1.5 py-0.2 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium">
                Auto-Purge Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 max-w-2xl leading-relaxed">
              Downloads are processed ephemerally in isolated volatile buffers. Files are automatically unlinked and permanently deleted immediately after delivery or when your browser session closes. We store zero media on server disks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono shrink-0 pl-11 sm:pl-0">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> No Persistent Cache
          </span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-zinc-400" /> RAM Buffering
          </span>
        </div>
      </div>
    </div>
  )
}
