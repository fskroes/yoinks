import assert from 'node:assert/strict'
import test from 'node:test'
import {KNOWN} from './assistant.js'

const claude = KNOWN.find(assistant => assistant.command === 'claude')!
const codex = KNOWN.find(assistant => assistant.command === 'codex')!

// Fixtures are trimmed captures from the real CLIs (the rule in this module:
// every invocation is run against the real binary). Not hand-imagined shapes.
const CLAUDE_OUTPUT = JSON.stringify({
  is_error: false,
  session_id: '0347019e-2fc0-4f3f-9505-56378900f94e',
  subtype: 'success',
  result: 'He spends the limit deliberately.\n[3:56] Opus draws 100% of the weekly limit',
  type: 'result',
})

const CODEX_OUTPUT = [
  '{"type":"thread.started","thread_id":"019fce82-85b1-7df2-96e4-dc9b17fa057a"}',
  '{"type":"turn.started"}',
  '{"type":"item.completed","item":{"id":"item_0","type":"error","message":"Skill descriptions were shortened."}}',
  '{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"[3:56] Opus draws 100% of the weekly limit"}}',
  '{"type":"turn.completed","usage":{"input_tokens":20149}}',
].join('\n')

test('claude: a turn is the result text and the session id', () => {
  const turn = claude.parse(CLAUDE_OUTPUT)

  assert.deepEqual(turn, {
    text: 'He spends the limit deliberately.\n[3:56] Opus draws 100% of the weekly limit',
    conversation: '0347019e-2fc0-4f3f-9505-56378900f94e',
  })
})

test('codex: a turn is the agent message and the thread id, ignoring other events', () => {
  const turn = codex.parse(CODEX_OUTPUT)

  assert.deepEqual(turn, {
    text: '[3:56] Opus draws 100% of the weekly limit',
    conversation: '019fce82-85b1-7df2-96e4-dc9b17fa057a',
  })
})

// The prompt travels on stdin, so arguments carry only flags and the handle —
// that is what removed the OS argument-size ceiling on long transcripts.
// These are the exact forms verified live against both binaries.
test('claude: both turns are phrased in the verified stdin form', () => {
  assert.deepEqual(claude.argsFor(), ['-p', '--output-format', 'json'])
  assert.deepEqual(claude.resumeArgsFor('conv-id'), ['-p', '--resume', 'conv-id', '--output-format', 'json'])
})

test('codex: both turns are phrased in the verified stdin form, prompt as "-"', () => {
  assert.deepEqual(codex.argsFor(), ['exec', '--json', '--skip-git-repo-check', '-'])
  assert.deepEqual(codex.resumeArgsFor('conv-id'), [
    'exec',
    'resume',
    'conv-id',
    '-',
    '--json',
    '--skip-git-repo-check',
  ])
})
