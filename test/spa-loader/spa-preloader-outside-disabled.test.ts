import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isWindows } from 'std-env'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { join } from 'pathe'

const isWebpack =
  process.env.TEST_BUILDER === 'webpack' ||
  process.env.TEST_BUILDER === 'rspack'

const isDev = process.env.TEST_ENV === 'dev'

const fixtureDir = fileURLToPath(new URL('../fixtures/spa-loader', import.meta.url))

if (!isDev) {
  await setup({
    rootDir: fixtureDir,
    dev: isDev,
    server: true,
    browser: true,
    setupTimeout: (isWindows ? 360 : 120) * 1000,
    nuxtConfig: {
      buildDir: isDev ? join(fixtureDir, '.nuxt', 'test', Math.random().toString(36).slice(2, 8)) : undefined,
      builder: isWebpack ? 'webpack' : 'vite',
      spaLoadingTemplate: true,
      experimental: {
        spaLoadingTemplateLocation: 'within',
      },
    },
  })
}

describe.skipIf(isDev)('spaLoadingTemplateLocation flag is set to `within`', () => {
  it('should render loader inside appTag', async () => {
    const html = await $fetch<string>('/spa')
    expect(html).toContain(`<div id="__nuxt"><div data-testid="loader">loading...</div></div>`)
  })

  it('spa-loader does not appear while the app is mounting', async () => {
    const page = await createPage()
    await page.goto(url('/spa'))

    await page.getByTestId('loader').waitFor({ state: 'visible' })
    expect(await page.getByTestId('content').isHidden()).toBeTruthy()

    await page.waitForFunction(() => window.useNuxtApp?.() && window.useNuxtApp?.().isHydrating)

    expect(await page.getByTestId('content').isHidden()).toBeTruthy()

    await page.getByTestId('content').waitFor({ state: 'visible' })

    await page.close()
  }, 60_000)
})
