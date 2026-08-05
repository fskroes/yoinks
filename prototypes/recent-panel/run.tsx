/**
 * PROTOTYPE — what should "recent yoinks" look like on the home screen?
 *
 * Throwaway. Not imported by `src/`; it imports `src/` rather than the other
 * way round. Four variants of the home screen, switchable with ←/→.
 *
 * Fake rows, held in memory. Nothing is read from
 * ~/.config/yoinks/history.json and nothing is written anywhere. No yt-dlp,
 * no network, no assistant on PATH.
 */
import React, {useState} from 'react'
import {Box, render, Text, useApp, useInput, useStdout} from 'ink'
import {FramedInput} from '../../src/components/framed-input.js'
import {FullScreen} from '../../src/components/fullscreen.js'
import {Logo} from '../../src/components/logo.js'
import {Panel} from '../../src/components/panel.js'
import {Shortcuts} from '../../src/components/shortcuts.js'
import {isThemeMode, ThemeProvider, useTheme, type ThemeMode} from '../../src/theme.js'

// ── the fake rows ────────────────────────────────────────────────────────────
// Deliberately awkward: one title far too long for any layout here, one title
// that is not a title at all (X posts have none), a mix of the three artifacts,
// and one platform per row. A prototype fed tidy data lies.
type Yoink = {title: string; platform: string; kind: 'mp4' | 'mp3' | 'txt'; when: string}

const ROWS: Yoink[] = [
  {title: 'I replaced my whole dev setup with a $20 gooseneck mic and 128 GB of RAM', platform: 'youtube', kind: 'mp4', when: '2h'},
  {title: 'Interview with the ffmpeg maintainer — 20 years of patches', platform: 'youtube', kind: 'txt', when: 'yesterday'},
  {title: 'x.com/user/status/1934…', platform: 'x', kind: 'mp4', when: 'yesterday'},
  {title: 'Lecture 4 — control surfaces', platform: 'youtube', kind: 'mp3', when: '3d'},
  {title: 'backstage clip', platform: 'instagram', kind: 'mp4', when: '5d'},
  {title: 'How we shipped the terminal rewrite', platform: 'youtube', kind: 'txt', when: 'last week'},
]

type VProps = {width: number; columns: number; selected: number}

const TAGLINE = 'yoink any video. paste. yoink. done.'
const cut = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`)

// ── shared bits of the real home screen ──────────────────────────────────────
const Gap = ({lines = 1}: {lines?: number}) => (
  <Box flexDirection="column" flexShrink={0}>
    {Array.from({length: lines}, (_, i) => (
      <Text key={i}> </Text>
    ))}
  </Box>
)

const PLATFORMS = 'youtube · x · instagram · threads · tiktok · +1800 more · v0.5.0'

function Head({width = PLATFORMS.length}: {width?: number}) {
  const theme = useTheme()
  return (
    <>
      <Logo />
      <Gap />
      <Text color={theme.primary}>{cut(TAGLINE, width)}</Text>
      <Text color={theme.gray} dimColor={theme.dimSecondary}>{cut(PLATFORMS, width)}</Text>
    </>
  )
}

function PasteBox({width}: {width: number}) {
  const theme = useTheme()
  return (
    <FramedInput title="Paste a link" width={width} button="yoink">
      <Text color={theme.gray} dimColor={theme.dimSecondary}>
        https://youtube.com/watch?v=…
      </Text>
    </FramedInput>
  )
}

function Hints({items}: {items: Array<[string, string]>}) {
  return (
    <>
      <Gap lines={2} />
      <Shortcuts items={items} />
    </>
  )
}

// ── A — a list under the input ───────────────────────────────────────────────
// The recommendation. One panel, below the paste box, only on the home screen.
export function VariantA({width, selected}: VProps) {
  const theme = useTheme()
  const panelWidth = width + 9 // reaches the right edge of the yoink button
  return (
    <>
      <Head />
      <Gap />
      <PasteBox width={width} />
      <Gap />
      <Panel title="recent" width={panelWidth}>
        {ROWS.map((row, index) => {
          const on = index === selected
          return (
            <Box key={row.title} justifyContent="space-between">
              <Text color={on ? theme.primary : theme.gray} dimColor={!on && theme.dimSecondary} bold={on}>
                {on ? '› ' : '  '}
                {cut(row.title, panelWidth - 26)}
              </Text>
              <Text color={theme.gray} dimColor={theme.dimSecondary}>
                {row.kind} · {row.when}
              </Text>
            </Box>
          )
        })}
      </Panel>
      <Hints items={[['↵', 'yoink'], ['↑↓', 'recent'], ['^t', 'theme'], ['^c', 'quit']]} />
    </>
  )
}

// ── B — a rail down the left ─────────────────────────────────────────────────
// What you pictured. The screen stops being centred to pay for it.
export function VariantB({columns, selected}: VProps) {
  const theme = useTheme()
  const railWidth = 30
  // the rail is paid for here: the paste box gives up the columns it takes
  const width = Math.max(14, Math.min(64, columns - railWidth - 4 - 9 - 4))
  return (
    <>
      <Box>
        <Box flexDirection="column" width={railWidth} marginRight={4}>
          <Panel title="recent" width={railWidth}>
            {ROWS.map((row, index) => {
              const on = index === selected
              return (
                <Text
                  key={row.title}
                  color={on ? theme.primary : theme.gray}
                  dimColor={!on && theme.dimSecondary}
                  bold={on}
                >
                  {on ? '› ' : '  '}
                  {cut(row.title, railWidth - 8)}
                </Text>
              )
            })}
          </Panel>
        </Box>
        <Box flexDirection="column" alignItems="center">
          {/* the header line loses columns to the rail as well */}
          <Head width={columns - railWidth - 4} />
          <Gap />
          <PasteBox width={width} />
        </Box>
      </Box>
      <Hints items={[['↵', 'yoink'], ['⇥', 'rail'], ['^t', 'theme'], ['^c', 'quit']]} />
    </>
  )
}

// ── C — one dim line, no panel ───────────────────────────────────────────────
// The smallest thing that answers "where did that file go". No list until asked.
export function VariantC({width, selected}: VProps) {
  const theme = useTheme()
  const row = ROWS[selected]!
  return (
    <>
      <Head />
      <Gap />
      <PasteBox width={width} />
      <Box width={width + 9} justifyContent="space-between">
        <Text color={theme.gray} dimColor={theme.dimSecondary}>
          last · {cut(row.title, width - 22)} · {row.kind}
        </Text>
        <Text color={theme.gray} dimColor={theme.dimSecondary}>↑ {ROWS.length - 1} more</Text>
      </Box>
      <Hints items={[['↵', 'yoink'], ['↑', 'recent'], ['^t', 'theme'], ['^c', 'quit']]} />
    </>
  )
}

// ── D — a strip across the top ───────────────────────────────────────────────
// The other half of what you pictured. Chips need short labels; titles are long.
export function VariantD({width, selected}: VProps) {
  const theme = useTheme()
  const stripWidth = width + 9
  return (
    <>
      <Box width={stripWidth} justifyContent="space-between">
        <Text color={theme.gray} dimColor={theme.dimSecondary}>recent</Text>
        <Text color={theme.gray} dimColor={theme.dimSecondary}>{ROWS.length} yoinks ›</Text>
      </Box>
      <Box width={stripWidth}>
        {ROWS.slice(0, 4).map((row, index) => (
          <Text key={row.title}>
            {index > 0 ? <Text color={theme.gray} dimColor={theme.dimSecondary}>{' · '}</Text> : null}
            <Text
              color={index === selected ? theme.primary : theme.gray}
              dimColor={index !== selected && theme.dimSecondary}
              bold={index === selected}
            >
              {cut(row.title, 16)}
            </Text>
          </Text>
        ))}
      </Box>
      <Gap />
      <Head />
      <Gap />
      <PasteBox width={width} />
      <Hints items={[['↵', 'yoink'], ['←→', 'recent'], ['^t', 'theme'], ['^c', 'quit']]} />
    </>
  )
}

// ── the switcher ─────────────────────────────────────────────────────────────
const VARIANTS = [
  {key: 'A', name: 'list under the input', render: VariantA},
  {key: 'B', name: 'rail down the left', render: VariantB},
  {key: 'C', name: 'one dim line', render: VariantC},
  {key: 'D', name: 'strip across the top', render: VariantD},
]

function Prototype({mode, start}: {mode: ThemeMode; start: number}) {
  const {exit} = useApp()
  const {stdout} = useStdout()
  const [index, setIndex] = useState(start)
  const [selected, setSelected] = useState(0)
  const [theme, setTheme] = useState<ThemeMode>(mode)

  useInput((input, key) => {
    if (input === 'q' || key.escape) exit()
    else if (key.leftArrow) setIndex(i => (i + VARIANTS.length - 1) % VARIANTS.length)
    else if (key.rightArrow) setIndex(i => (i + 1) % VARIANTS.length)
    else if (key.upArrow) setSelected(s => (s + ROWS.length - 1) % ROWS.length)
    else if (key.downArrow) setSelected(s => (s + 1) % ROWS.length)
    else if (input === 't') setTheme(m => (m === 'auto' ? 'light' : m === 'light' ? 'dark' : 'auto'))
    else if (/^[1-4]$/.test(input)) setIndex(Number(input) - 1)
  })

  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80
  const width = Math.max(14, Math.min(64, columns - 6))
  const variant = VARIANTS[index]!

  return (
    <ThemeProvider mode={theme}>
      <FullScreen>
        <variant.render width={width} columns={columns} selected={selected} />
      </FullScreen>
      {/* obviously not part of the design being judged */}
      <Box justifyContent="center">
        <Text inverse bold>{`  ◂  ${variant.key} — ${variant.name}  ▸  `}</Text>
        <Text dimColor>{`  ←→ variant · ↑↓ row · t theme (${theme}) · q quit`}</Text>
      </Box>
    </ThemeProvider>
  )
}

const flag = process.argv.indexOf('--theme')
const mode = flag >= 0 && isThemeMode(process.argv[flag + 1]) ? (process.argv[flag + 1] as ThemeMode) : 'auto'
// --variant B only picks the one it opens on; ←/→ still reach the rest
const asked = process.argv[process.argv.indexOf('--variant') + 1]?.toUpperCase()
const start = Math.max(0, VARIANTS.findIndex(v => v.key === asked))
render(<Prototype mode={mode} start={start} />)
