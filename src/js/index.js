import Search from './models/Search';
import  *as searchView from './views/searchView'; 
import {elements, renderLoader, clearLoader} from './views/base';
import Recipe from './models/Recipe';
import *as recipeView from './views/recipeView';
import *as listView from './views/listView';
import *as likesView from './views/likesView';
import List from './models/List';
import Likes from './models/Likes';
import { basename } from 'path';



/**
 * search object
 * current recipe object
 * shopping list object
 * liked recipes
 */

const state = {};
const controlSearch = async () =>{
   //1) query from the view
   const query = searchView.getInput();
   
   if(query){
       // new search object and add to state
       state.search = new Search(query);
       // prepare UI for results
       searchView.clearInput();
       searchView.clearResults();
       renderLoader(elements.searchRes)
       try{
         await state.search.getResults();
      
       //render results on UI
       clearLoader();
       searchView.renderResults(state.search.result);
       }catch(error){
          alert('something went wrong');
          clearLoader();
       }
       // search for recipes
   }
}
elements.searchForm.addEventListener('submit', e => {
   e.preventDefault(); 
   controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
   const btn =  e.target.closest('.btn-inline');
   if(btn){
      const goToPage = parseInt(btn.dataset.goto, 10);
      searchView.clearResults();
      searchView.renderResults(state.search.result, goToPage);
   }
})

//recipe controller

const controlRecipe = async () =>{
   const id = window.location.hash.replace('#', '');
  
   if(id){
      //prepare ui for changes
      recipeView.clearRecipe();
      renderLoader(elements.recipe);
      //highlight selected search item
      if(state.search){
         searchView.highlightSelected(id);
      }
      //create new recipe object
      state.recipe = new Recipe(id);
      //get recipe data
      try{
         await state.recipe.getRecipe();
         state.recipe.parseIngredients();
         //calculate servings and time
         state.recipe.calcTime();
         state.recipe.calServings();
         //render recipe

         //render recipe
         clearLoader();
         recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
       
      }catch(error){
       alert('error processing recipe');
     }
     
   }
}

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//shopping list controller
const controlList = ()=>{
if(!state.list) state.list = new List();
state.recipe.ingredients.forEach(el => {
   const item = state.list.addItem(el.count, el.unit, el.ingredient);
   listView.renderItem(item);
});
}

//like controller
const controlLike = () => {
   if(!state.likes) state.likes = new Likes();
   const currentID = state.recipe.id;
   //user hasn't liked
   if(!state.likes.isLiked(currentID)){
      //add like to state
      const newLike = state.likes.addLike(
         currentID,
         state.recipe.title,
         state.recipe.author,
         state.recipe.img
      );

      //toggle the button
      likesView.toggleLikeBtn(true);
      //addlike to ui
       likesView.renderLIke(newLike);

   //user has liked
   } else {
      //remove like from the state
      state.likes.deleteLike(currentID);
      //toggle the like button
      likesView.toggleLikeBtn(false);
      //remove like from ui list
      likesView.deleteLike(currentID);

   }
   likesView.toggleLikeMenu(state.likes.getNumLikes());
 }
//handle delete nd update list items
elements.shopping.addEventListener('click', e =>{
   const id = e.target.closest('.shopping__item').dataset.itemid;
   if(e.target.matches('.shopping__delete,.shopping__delete *')){
      state.list.deleteItem(id);

      listView.deleteItem(id);
   } else if(e.target.matches('.shopping__count-value')){
      const val = parseFloat(e.target.value);
      state.list.updateCount(id, val);
   }
});

//restore like recipes on page oads
window.addEventListener('load', () => {
state.likes = new Likes();
state.likes.readStorage();
likesView.toggleLikeMenu(state.likes.getNumLikes());
//render the existing likes
state.likes.likes.forEach(like => likesView.renderLIke(like));
})
//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
      if(e.target.matches('.btn-decrease, .btn-decrease *')){
         if(state.recipe.servings > 1){
          state.recipe.updateServings('dec');}
          recipeView.updateServingsIng(state.recipe);
      }else if (e.target.matches('.btn-increase, .btn-increase *')){
         state.recipe.updateServings('inc');
         recipeView.updateServingsIng(state.recipe);
      }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
         controlList();
       }else if(e.target.matches('.recipe__love, .recipe__love *')){
          controlLike();
       }
});
