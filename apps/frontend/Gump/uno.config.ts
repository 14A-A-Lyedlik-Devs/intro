import { defineConfig, presetAttributify, presetIcons, presetUno, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetWebFonts({
      fonts: {
        sans: 'Ubuntu',
      },
    }),
  ],
  theme: {
    colors: {
      crimson: {
        50: '#FFF3F6',
        100: '#FFDAE5',
        200: '#FCC8D8',
        500: '#D12C5F',
        600: '#A8244E',
      },
      orange: {
        50: '#FEE5E3',
        100: '#FCCAC0',
        200: '#F89679',
        500: '#F35827',
      },
      brown: {
        500: '#912808',
        900: '#2A1700',
      },
      blue: '#0842A0',
      grey: {
        700: '#3A3A3A',
        800: '#2A2A2A',
        900: '#1A1A1A',
      },
      red: '#ce2c2c',
      green: '#3FB950',
      purple: '#A371F7',
    },
    textShadow: {
      DEFAULT: '0px 0px 6px rgba(151, 39, 4, 0.4)',
      crimson: '0px 0px 6px rgba(209, 44, 95, 0.4)',
      orange: '0px 0px 6px rgba(243, 88, 39, 0.4)',
      blue: '0px 0px 6px rgba(8, 66, 160, 0.4)',
      white: '0px 0px 6px rgba(255, 255, 255, 0.4)',
    },
    boxShadow: {
      orange: '0px 8px 10px -4px rgba(243, 88, 39, 0.5)',
      crimsonDown: '0px 8px 10px -4px rgba(209, 44, 95, 0.5)',
      crimsonUp: '0px -8px 15px -5px rgba(209, 44, 95, 0.5)',
      inner: 'inset 0px 2px 12px -4px rgb(243, 88, 39)',
      grey: '0px 2px 6px rgba(0, 0, 0, 0.5)',
    },
  },
  shortcuts: {
    btnOrange: 'w-max rounded-full bg-orange-500 px-10 py-4 font-bold text-white shadow-orange',
    btnCrimson: 'w-max rounded-full bg-crimson-500 px-10 py-4 font-bold text-white shadow-crimsonDown',
    linkOrange:
      'text-orange-500 text-shadow-orange underline underline-offset-5 underline-orange-500 font-bold',
    coolOl:
      'my-2 pl-6 list-outside list-disc space-y-2 leading-relaxed',
  },
})
