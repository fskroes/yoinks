import {spawn} from 'node:child_process'

/**
 * Does this command exist and run? Every external tool Yoinks depends on —
 * yt-dlp, ffmpeg, whisper.cpp, an assistant on PATH — is found this way and
 * fails with the fix in the message when it is missing.
 *
 * async on purpose: a spawnSync here blocks the event loop, which freezes ink
 * mid-frame — the user hits enter and sees nothing until it returns.
 */
export function commandWorks(cmd: string, args: string[]): Promise<boolean> {
  return new Promise(resolve => {
    let child
    try {
      child = spawn(cmd, args, {stdio: 'ignore', timeout: 10_000})
    } catch {
      resolve(false)
      return
    }
    child.on('error', () => resolve(false))
    child.on('close', code => resolve(code === 0))
  })
}
