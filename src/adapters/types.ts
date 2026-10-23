import type { Converted } from '../convert.js'
import type { Note } from '../vault.js'

/** One note, converted and ready to write. */
export type Page = {
  note: Note
  slug: string
  title: string
  /** YYYY-MM-DD from the `date` or `created` property, if there is one. */
  date?: string
  tags: string[]
  /** One sentence for listings and link previews, from a `description` property. */
  description?: string
  converted: Converted
}

export type WriteContext = {
  vaultRoot: string
  /** Attachments the pages refer to: where each is in the vault, and the name it is copied under. */
  files: { path: string; name: string }[]
}

export type RenderResult = {
  /** Every file to write, relative to the output folder, with its contents. */
  files: Map<string, string | Buffer>
  /** Things the format could not carry, for the report. */
  warnings: string[]
}

export type SiteOptions = {
  /** Where the pages will live on the site, e.g. `/writing/`. */
  base: string
}

export type Adapter = {
  name: string
  htmlCallouts: boolean
  noteHref: (slug: string, anchor?: string) => string
  /** Href for a copied attachment, by the name it is copied under. */
  fileHref: (name: string) => string
  render: (pages: Page[], ctx: WriteContext) => RenderResult
}
