<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useTranslationStore } from '@/stores/translationStore'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { findChildWithCursor, useCursorPosition } from '@/utils/cursorPosition'
import RenderHtml from '@/components/RenderHtml'

const translate = useTranslationStore()
const user = useUserStore()
const router = useRouter()

const { checkDirty } = translate
const { translations, locales, initialTranslations, updateIsFromFetch } = storeToRefs(translate)
const selectedKey = computed(() => router.currentRoute.value.params.key.toString())
const { languages } = storeToRefs(user)

window.onbeforeunload = () => {
  if (translate.dirty) {
    return 'You have unsaved changes, are you sure you want to leave?'
  }
}

const resize = (event: Event) => {
  if (!event.target) {
    return
  }
  const target = event.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = target.scrollHeight + 'px'
}

const emit = defineEmits(['update'])

updateIsFromFetch.value = false

watch(
  () => translate.$state.translations,
  () => {
    let fetchCount = 0
    locales.value.forEach((locale) => {
      const element = document.getElementById(locale)
      if (element && updateIsFromFetch.value) {
        const data = translations.value[locale][selectedKey.value]
        element.innerHTML = colorSpecialCharacters(data)
        fetchCount++
      }
      resize({ target: element } as unknown as Event)
    })
    if (fetchCount === locales.value.length) {
      updateIsFromFetch.value = false
      emit('update')
    }
    checkDirty()
  },
  { deep: true }
)

onMounted(() => {
  if (!translate.checkKey(selectedKey.value)) {
    router.push({ name: 'not-found' })
  }
  locales.value.forEach((locale) => {
    resize({ target: document.getElementById(locale) } as unknown as Event)
  })
})

const changesClasses = (locale: string, key: string) =>
  computed(() => {
    const classes: any = {}
    if (!initialTranslations.value[locale]) {
      classes['bg-crimson-500'] = true
      return classes
    }
    if (translations.value[locale][key] !== initialTranslations.value[locale][key]) {
      classes['bg-crimson-500'] = true
    } else if (translations.value[locale][key] === initialTranslations.value[locale][key]) {
      classes['bg-crimson-50'] = true
    }
    return classes
  })

const inputFunc = (locale: string) => {
  const element = document.getElementById(locale)
  let data = element?.innerHTML || ''

  if (element) {
    const absoluteCursorPosition = useCursorPosition(element)?.[0] || 0
    data = data?.replace(/(<([^>]+)>)/gi, '')
    translations.value[locale][selectedKey.value] = data

    checkDirty()

    element.innerHTML = colorSpecialCharacters(data)

    const selAfterInner = window.getSelection()
    const focusNodeAfterInner = selAfterInner?.focusNode // div (parent of text)

    const { textNode, relativeCursorPosition } = findChildWithCursor(
      focusNodeAfterInner as Node,
      absoluteCursorPosition
    )

    // set the cursor position
    if (data) {
      const range = document.createRange()
      range.setStart(textNode, relativeCursorPosition)
      range.setEnd(textNode, relativeCursorPosition)
      selAfterInner?.removeAllRanges()
      selAfterInner?.addRange(range)
    }
  }
}

let specialKey: string | undefined = undefined

const colorSpecialCharacters = (text: string) => {
  if (text === undefined) {
    return ''
  }
  const regex = /{.*?}|@:.*?[a-zA-Z]*/g
  const matches = text.match(regex)
  if (matches) {
    matches.forEach((match) => {
      const regex = new RegExp(match, 'g')
      if (match.includes('{')) {
        const replacement = `<span class="text-crimson-500">${match}</span>`
        text = text.replace(regex, replacement)
        return
      }
      const replacement = `<span text="orange-500">${match}</span>`

      if (!specialKey) {
        specialKey = match
      }

      text = text.replace(regex, replacement)
    })
  }
  return text
}

const reset = (locale: string, key: string) => {
  let initialValue = ''
  if (initialTranslations.value[locale]) {
    initialValue = initialTranslations.value[locale][key]
  }
  translations.value[locale][key] = initialValue
  const element = document.getElementById(locale)
  if (element) {
    element.innerHTML = colorSpecialCharacters(initialValue)
  }
  checkDirty()
}

const isMobile = computed(() => {
  return window.innerWidth < 768
})
</script>

<template>
  <div w="full md:4/5" flex="~ col" gap="5">
    <div
      v-for="locale in locales.filter((locale) => locale === 'notes')"
      :key="locale"
      flex="~ row"
      gap="4"
      my="6"
      place="items-center"
    >
      <div flex="~ col" gap="2">
        <label w="10 md:16" text="md md:xl" font="bold">Notes</label>
        <div
          v-if="isMobile"
          cursor="pointer"
          :class="changesClasses(locale, selectedKey).value"
          w="8"
          h="2"
          rounded="full"
          @click="reset(locale, selectedKey)"
        />
      </div>
      <RenderHtml
        :id="locale"
        :contenteditable="true"
        :html="colorSpecialCharacters(translations[locale][selectedKey])"
        @input="inputFunc(locale)"
        @keydown.enter.prevent
      />
      <div
        v-if="!isMobile"
        cursor="pointer"
        :class="changesClasses(locale, selectedKey).value"
        w="2"
        h="8"
        rounded="full"
        @click="reset(locale, selectedKey)"
      />
    </div>
    <hr border="orange-500 1" w="2/6" pos="relative" mx="auto" left="0" />
    <div
      v-for="locale in locales.filter((locale) => locale !== 'notes')"
      :key="locale"
      flex="~ row"
      gap="4"
      my="6"
      place="items-center"
    >
      <div flex="~ col" gap="2" place="items-center">
        <label w="10 md:16" text="md md:xl" font="bold">{{ locale }}</label>
        <div
          v-if="isMobile"
          cursor="pointer"
          :class="changesClasses(locale, selectedKey).value"
          w="8"
          h="2"
          rounded="full"
          @click="reset(locale, selectedKey)"
        />
      </div>
      <RenderHtml
        :id="locale"
        :contenteditable="languages.includes(locale)"
        :html="colorSpecialCharacters(translations[locale][selectedKey])"
        @input="inputFunc(locale)"
        @keydown.enter.prevent
      />
      <div
        v-if="!isMobile"
        cursor="pointer"
        :class="changesClasses(locale, selectedKey).value"
        w="2"
        h="8"
        rounded="full"
        @click="reset(locale, selectedKey)"
      />
    </div>
    <div
      v-if="specialKey && specialKey.length > 2"
      mt="10"
      text="center lg md:xl"
      class="link-orange"
    >
      <RouterLink :to="{ name: 'translate', params: { key: specialKey.slice(2) } }">
        {{ specialKey }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped></style>
