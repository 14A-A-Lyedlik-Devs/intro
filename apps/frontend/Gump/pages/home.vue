<script setup lang="ts">
const recipe = useRecipeStore()
const ui = useUIStore()
const user = useUserStore()

ui.activeNav = 'Home'

watch(
  () => ui.activeSort,
  async () => await recipe.getRecipesBySort(ui.activeSort),
  { immediate: true },
)

onMounted(async () => {
  if (user.current.token !== 'offline')
    await user.getUserData()
})

function handleLiked(r: SearchRecipe) {
  if (r) {
    r.isLiked = !r.isLiked
    r.likeCount += r.isLiked ? 1 : -1
  }
}

function handleSaved(r: SearchRecipe) {
  if (r) {
    r.isSaved = !r.isSaved
    r.saveCount += r.isSaved ? 1 : -1
  }
}
</script>

<template>
  <ion-page bg-crimson-50>
    <TheHeader show-icons :title="$t('HomeNav')" />
    <div v-if="recipe.recipes" grow overflow-y-auto pb-30>
      <RecipeBox v-for="r of recipe.recipes" :key="r.id" :recipe="r" @like="handleLiked(r)" @save="handleSaved(r)" />
    </div>
    <TheNavbar />
  </ion-page>
</template>
