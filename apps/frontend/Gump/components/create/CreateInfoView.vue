<script setup lang="ts">
// import { debounce } from 'lodash-es'

const recipe = useRecipeStore()
const ui = useUIStore()
const localePath = useLocalePath()

const visibilityData = computed(() => {
  return {
    Public: {
      icon: 'i-shadow:ph-users-three-fill',
      active: recipe.currentRecipe?.isPrivate === false,
    },
    Private: {
      icon: 'i-shadow:ph-lock-simple-bold',
      active: recipe.currentRecipe?.isPrivate === true,
    },
  }
})

async function checkDone() {
  if (recipe.currentRecipe) {
    if (recipe.currentRecipe.title.length > 0 && recipe.currentRecipe.language.length > 0) {
      if (ui.createIsEditing)
        debouncedRecipeUpdate(recipe.currentRecipe)
      ui.createHeaderStates[0] = true
    } else {
      ui.createHeaderStates[0] = false
    }
  }
}

const langs = computed({
  get: () => {
    // get language by code and return name of language
    const language = useLanguages.find(lang => lang.code === recipe.currentRecipe!.language)
    return language ? language.name : ''
  },
  set: (value: string) => {
    // get language by name and return code of language
    const language = useLanguages.find(lang => lang.name === value)
    if (language)
      recipe.currentRecipe!.language = language.code
    else
      recipe.currentRecipe!.language = ''
  },
})

const confirmDelete = ref(false)

async function deleteRecipe() {
  if (confirmDelete.value) {
    if (ui.createIsEditing)
      await recipe.deleteRecipe(recipe.currentRecipe!.id)

    ui.createHeaderStates = [false, false, false, false]
    ui.createHeaderIndex = 0
    recipe.currentRecipe = undefined
    await navigateTo(localePath('/home'))
  } else {
    confirmDelete.value = true
    setTimeout(() => {
      confirmDelete.value = false
    }, 3000)
  }
}
</script>

<template>
  <div v-if="recipe.currentRecipe" flex="~ col" items-center justify-between gap-7>
    <div flex="~ col" items-center justify-between gap-2>
      <p my-1 text-xl font-bold>
        {{ $t('CreateTitle') }}
      </p>
      <TextInput
        v-model:text="recipe.currentRecipe.title"
        @update:text="checkDone()"
      />
    </div>
    <div flex="~ col" items-center justify-between gap-2>
      <p my-1 text-xl font-bold>
        {{ $t('CreateVisibility') }}
      </p>
      <div flex="~ col" gap-2>
        <div
          v-for="(visibility, key) in visibilityData"
          :key="key"
          flex="~ row" ml-2 items-center gap-3
        >
          <div
            flex="~ col" cursor-pointer items-center justify-between
            @click="recipe.currentRecipe.isPrivate = !recipe.currentRecipe.isPrivate; checkDone()"
          >
            <div
              h-12 w-12
              :class="visibility.active ? `${visibility.icon} text-orange-500` : `${visibility.icon} text-brown-500`"
            />
            <div
              :class="visibility.active ? 'visible' : 'invisible'"
              h-1.5 w-9 rounded-full bg-orange-500 shadow-md shadow-orange-500
            />
          </div>
          <div flex="~ col" justify-between>
            <p my-1 text-lg font-bold>
              {{ $t(`CreateVisibility${key}Title`) }}
            </p>
            <p my-1>
              {{ $t(`CreateVisibility${key}Desc`) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div flex="~ col" items-center justify-between gap-2>
      <p my-1 text-xl font-bold>
        {{ $t('CreateLanguage') }}
      </p>
      <SearchSelect
        v-model:model="langs"
        w-60
        :options="useLanguages.map(lang => lang.name)"
        mode="single"
        @update:model="checkDone()"
      />
    </div>
    <MainButton
      mt-10 transform-none self-center
      :title="confirmDelete ? 'Click again to confirm' : ''"
      color="crimsonGradient" icon-type="delete" @click="deleteRecipe()"
    />
  </div>
</template>

<style scoped>

</style>
