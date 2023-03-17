using System.Text.RegularExpressions;
using Gump.Data.Models;
using MongoDB.Driver;

namespace Gump.Data.Repositories;

public partial class RecipeRepository : RepositoryBase<RecipeModel>
{
	private readonly MongoDbConfig mongoDbConfig;
	private UserRepository UserRepository => new(mongoDbConfig);
	private CategoryRepository CategoryRepository => new(mongoDbConfig);

	public RecipeRepository(MongoDbConfig mongoDbConfig) : base(mongoDbConfig)
	{
		this.mongoDbConfig = mongoDbConfig;
	}

	public RecipeModel Create(RecipeModel recipe)
	{
		recipe.Id = GetId();

		ValidateFields(recipe, "Title", "AuthorId", "Language", "Serves", "Categories", "Ingredients", "Steps", "OriginalRecipeId", "IsPrivate");
		NullifyFields(recipe, "Forks", "Likes", "SaveCount", "ReferenceCount");

		RecipeStuff(recipe);

		foreach (var ingredient in recipe.Ingredients)
		{
			// check if ingredient has linkedRecipe
			if (ingredient.LinkedRecipeId != 0)
			{
				// if it has, increase its referenceCount
				var linkedRecipe = GetById(ingredient.LinkedRecipeId);
				linkedRecipe.ReferenceCount++;
				Update(linkedRecipe);
			}
		}

		// if originalRecipeId is not 0, check if it exists
		// and add this recipe to the original recipe's forks list
		// and increase the referenceCount of the original recipe
		if (recipe.OriginalRecipeId != 0)
		{
			var originalRecipe = GetById(recipe.OriginalRecipeId);

			originalRecipe.Forks.Add(recipe.Id);
			originalRecipe.ReferenceCount++;
			Update(originalRecipe);
		}

		try
		{
			Collection.InsertOne(recipe);
		}
		catch (MongoException ex)
		{
			throw new AggregateException($"Error while creating {nameof(recipe)}", ex);
		}


		return recipe;
	}

	public RecipeModel Update(RecipeModel recipe)
	{
		ValidateFields(recipe, "Title", "AuthorId", "Language", "Serves", "Categories", "Ingredients", "Steps", "OriginalRecipeId", "IsPrivate");

		RecipeStuff(recipe);

		// check if recipes in forks list exists
		if (recipe.Forks.Count > 0)
		{
			foreach (var forkRecipeId in recipe.Forks)
			{
				GetById(forkRecipeId);
			}
		}

		// check if recipe in originalRecipeId exists
		if (recipe.OriginalRecipeId != 0)
		{
			GetById(recipe.OriginalRecipeId);
		}

		// originalRecipeId cannot be changed
		if (recipe.OriginalRecipeId != GetById(recipe.Id).OriginalRecipeId)
		{
			throw new RestrictedException($"{nameof(recipe.OriginalRecipeId)} cannot be changed");
		}

		// check if the referenceCount has changed
		var existingRecipe = GetById(recipe.Id);
		if (Math.Abs(recipe.ReferenceCount - existingRecipe.ReferenceCount) > 1)
		{
			throw new RestrictedException($"{nameof(recipe.ReferenceCount)} can only be increased/decreased by 1");
		}
		if (Math.Abs(recipe.SaveCount - existingRecipe.SaveCount) > 1)
		{
			throw new RestrictedException($"{nameof(recipe.SaveCount)} can only be increased/decreased by 1");
		}

		try
		{
			Collection.ReplaceOne(x => x.Id == recipe.Id, recipe);
		}
		catch (MongoException ex)
		{
			throw new AggregateException($"Error while updating {nameof(recipe)}", ex);
		}

		return recipe;
	}

	// checks that the create and update methods have in common
	private void RecipeStuff(RecipeModel recipe)
	{
		UserRepository.GetById(recipe.AuthorId);

		foreach (var ingredient in recipe.Ingredients)
		{
			// check if ingredient has linkedRecipe
			if (ingredient.LinkedRecipeId != 0)
			{
				// if it has, check if the linked recipe exists
				GetById(ingredient.LinkedRecipeId);
			}

			// if ingredient has value or volume, it must have both
			if ((ingredient.Value != 0 || !string.IsNullOrWhiteSpace(ingredient.Volume)) &&
				(ingredient.Value == 0 || string.IsNullOrWhiteSpace(ingredient.Volume)))
			{
				throw new RestrictedException($"{nameof(ingredient)} must have both value and volume or neither");
			}
		}

		// check if visibleTo users exist
		foreach (var userId in recipe.VisibleTo)
		{
			UserRepository.GetById(userId);
		}

		// check if categories exist
		foreach (var categoryId in recipe.Categories)
		{
			CategoryRepository.GetById(categoryId);
		}

		// check language format
		if (!LanguageFormat().IsMatch(recipe.Language))
		{
			throw new ArgumentException($"{nameof(recipe.Language)} format is invalid");
		}

		// serves must be at least 1
		if (recipe.Serves < 1)
		{
			throw new ArgumentException($"{nameof(recipe.Serves)} must be at least 1");
		}
	}

	[GeneratedRegex("^[a-z]{2}_[A-Z]{2}$")]
	private static partial Regex LanguageFormat();

	public void Delete(ulong id)
	{
		var recipe = GetById(id);

		if (recipe.Forks.Count > 0)
		{
			throw new RestrictedException("Recipe can only be archived, because it has forks");
		}

		if (recipe.ReferenceCount != 0)
		{
			throw new RestrictedException("Recipe can only be archived, because it has references");
		}

		if (recipe.SaveCount != 0)
		{
			throw new RestrictedException("Recipe can only be archived, because it has saves");
		}

		// Get all the users who have liked this recipe
		var users = recipe.Likes.Select(UserRepository.GetById).ToList();

		// For each user, remove the recipe from their list of liked recipes
		foreach (var user in users)
		{
			user.Likes.Remove(recipe);
			UserRepository.Update(user);
		}

		try
		{
			Collection.DeleteOne(x => x.Id == id);
		}
		catch (MongoException ex)
		{
			throw new AggregateException($"Error while deleting {nameof(recipe)}", ex);
		}
	}
}
