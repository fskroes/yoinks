import React from 'react'
import {Box, Text} from 'ink'
import {formatAge, truncate} from '../lib/format.js'
import type {RecentRow} from '../lib/history.js'
import {useTheme} from '../theme.js'
import {Panel} from './panel.js'

/** Rows on screen. The file keeps fifty; the home screen is not a library. */
export const RECENT_ROWS = 6

/**
 * The title as it is rendered — the app hit-tests clicks against this exact
 * string, the same way it does the format list (see lib/click-map.ts).
 */
export function recentTitle(row: RecentRow, width: number): string {
  return truncate(row.title, width - 28)
}

/**
 * What yoinks did, newest first: the source's own name, the artifact that came
 * out — or `asked`, when the source produced an answer and no file — and how
 * long ago. Selected row moves with ↑/↓ and re-yoinks its source on ↵.
 */
export function Recent({rows, selected, width}: {rows: RecentRow[]; selected: number; width: number}) {
  const theme = useTheme()
  return (
    <Panel title="recent" width={width}>
      {rows.slice(0, RECENT_ROWS).map((row, index) => {
        const on = index === selected
        return (
          <Box key={row.url} justifyContent="space-between">
            <Text color={on ? theme.primary : theme.gray} dimColor={!on && theme.dimSecondary} bold={on}>
              {on ? '› ' : '  '}
              {recentTitle(row, width)}
            </Text>
            <Text color={theme.gray} dimColor={theme.dimSecondary}>
              {row.artifact} · {formatAge(row.at)}
            </Text>
          </Box>
        )
      })}
    </Panel>
  )
}
