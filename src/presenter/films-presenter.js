import {render, remove} from '../framework/render.js';
import {filter, sortDateDown, sortRatingDown} from '../utils.js';
import {SortType, UpdateType, UserAction} from '../const.js';
import FilmsContainerView from '../view/films-container-view.js';
import FilmsListView from '../view/films-list-view.js';
import FilmslistContainerView from '../view/films-list-container-view.js';
import ShowMoreButtonView from '../view/show-more-button-view.js';
import LoadingView from '../view/loading-view.js';
import NoFilmView from '../view/no-film-view';
import ProfileView from '../view/profile-view';
import SortView from '../view/sort-view';
import FooterStatisticsView from '../view/footer-statistics-view';
import FilmCardPresenter from './film-card-presenter';
import FilterPresenter from './filter-presenter';


const FILM_COUNT_PER_STEP = 5;
const headerElement = document.querySelector('.header');
const mainElement = document.querySelector('.main');
const footerElement = document.querySelector('.footer');


export default class FilmsPresenter {

  #filterModel = null;
  #filmsContainer = mainElement;
  #filmsModel = null;
  #filmsComponent = new FilmsContainerView();
  #filmsListComponent = new FilmsListView();
  #filmsListContainerComponent = new FilmslistContainerView();
  #noFilmComponent = new NoFilmView();
  #loadingComponent = new LoadingView();
  #sortComponent = null;
  #renderedFilmCount = FILM_COUNT_PER_STEP;
  #showMoreButtonComponent = null;
  #filmCardPresenterList = new Map();
  #watchedCount = null;
  #currentSortType = SortType.DEFAULT;
  #profileComponent = null;
  #footerStatisticsComponent = null;
  #filterPresenter = null;
  #isLoading = true;

  constructor(filmsModel, filterModel) {
    this.#filmsModel = filmsModel;
    this.#filterModel = filterModel;

    this.#filmsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get films() {
    const filterType = this.#filterModel.filter;
    const films = this.#filmsModel.films;
    const filteredFilms = filter[filterType](films);

    switch (this.#currentSortType) {
      case SortType.DATE_DOWN:
        return filteredFilms.slice().sort(sortDateDown);
      case SortType.RATING_DOWN:
        return filteredFilms.slice().sort(sortRatingDown);
    }
    return filteredFilms;
  }

  #renderFilms(films) {
    films.forEach((film) => this.#renderFilmCard(film));
  }

  #renderFilmsList = () => {
    const filmCount = this.films.length;
    const films = this.films.slice(0, Math.min(filmCount, this.#renderedFilmCount));

    if(filmCount > 0){this.#renderSort();}
    render(this.#filmsComponent, this.#filmsContainer);
    if(filmCount > 0){
      render(this.#filmsListComponent, this.#filmsComponent.element);
      render(this.#filmsListContainerComponent, this.#filmsListComponent.element);
      this.#renderFilms(films);
    }else{
      render(this.#noFilmComponent, this.#filmsComponent.element);
    }

    if (filmCount > this.#renderedFilmCount) {
      this.#showMoreButtonComponent = new ShowMoreButtonView({
        onClick: this.#showMoreButtonClickHandler
      });
      render(this.#showMoreButtonComponent, this.#filmsListComponent.element);
    }
  };

  #clearFilmsList({resetRenderedFilmCount = false, resetSortType = false} = {}) {
    const filmCount = this.films.length;
    this.#filmCardPresenterList.forEach((presenter) => presenter.destroy());
    this.#filmCardPresenterList.clear();
    this.#renderedFilmCount = FILM_COUNT_PER_STEP;
    remove(this.#showMoreButtonComponent);
    remove(this.#noFilmComponent);
    remove(this.#sortComponent);

    if (resetRenderedFilmCount) {
      this.#renderedFilmCount = FILM_COUNT_PER_STEP;
    } else {
      this.#renderedFilmCount = Math.min(filmCount, this.#renderedFilmCount);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }
  }

  #renderMainFilmsContainer = () => {
    const filmCount = this.films.length;
    this.#watchedCount = this.#filmsModel.watchedCount;
    this.#profileComponent = new ProfileView(this.#watchedCount);
    this.#footerStatisticsComponent = new FooterStatisticsView(filmCount);
    this.#filterPresenter = new FilterPresenter({
      filterContainer: mainElement,
      filterModel: this.#filterModel,
      filmsModel: this.#filmsModel
    });

    this.#filterPresenter.init();

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }
    render(this.#profileComponent, headerElement);
    render(this.#footerStatisticsComponent, footerElement);

    this.#renderFilmsList();
  };

  #clearMainFilmsContainer({resetRenderedFilmCount = false, resetSortType = false} = {}) {
    const filmCount = this.films.length;

    this.#filmCardPresenterList.forEach((presenter) => presenter.destroy());
    this.#filmCardPresenterList.clear();

    remove(this.#noFilmComponent);

    remove(this.#profileComponent);
    this.#filterPresenter.destroy();

    remove(this.#footerStatisticsComponent);
    remove(this.#loadingComponent);
    this.#clearFilmsList();

    if (resetRenderedFilmCount) {
      this.#renderedFilmCount = FILM_COUNT_PER_STEP;
    } else {
      this.#renderedFilmCount = Math.min(filmCount, this.#renderedFilmCount);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }

  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }
    this.#currentSortType = sortType;

    this.#clearFilmsList({resetRenderedFilmCount: true, resetSortType: false});
    this.#renderFilmsList();
  };

  #renderSort = () =>{
    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      onSortTypeChange: this.#handleSortTypeChange
    });
    render(this.#sortComponent, mainElement);
  };

  #showMoreButtonClickHandler = () => {
    const filmCount = this.films.length;
    const newRenderedFilmCount = Math.min(filmCount, this.#renderedFilmCount + FILM_COUNT_PER_STEP);
    const films = this.films.slice(this.#renderedFilmCount, newRenderedFilmCount);

    this.#renderFilms(films);
    this.#renderedFilmCount = newRenderedFilmCount;

    if (this.#renderedFilmCount >= filmCount) {
      this.#showMoreButtonComponent.element.remove();
      this.#showMoreButtonComponent.removeElement();
    }
  };

  #handlePopupChange = () => {
    this.#filmCardPresenterList.forEach((presenter) => presenter.removePopup());
  };

  #handleViewAction = (actionType, updateType, update) => {
    console.log(`handleViewAction ${ actionType}` );
    switch (actionType) {
      case UserAction.UPDATE_FILM_CARD:
        this.#filmsModel.updateFilm(updateType, update);
        break;

    }
  };

  #handleModelEvent = (updateType, data) => {
    console.log(`обновилась filmsModel в films-presenter` );
    switch (updateType) {
      case UpdateType.PATCH:
        this.#filmCardPresenterList.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearFilmsList({resetRenderedFilmCount: false, resetSortType: false});
        this.#renderFilmsList();
        break;
      case UpdateType.MAJOR:
        this.#clearMainFilmsContainer({resetRenderedFilmCount: false, resetSortType: false});
        this.#renderMainFilmsContainer();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#clearMainFilmsContainer();
        this.#renderMainFilmsContainer();
        break;
    }
  };

  #renderFilmCard = (film) => {
    const filmCardPresenter = new FilmCardPresenter({
      filmsListContainer: this.#filmsListContainerComponent.element,
      onDataChange: this.#handleViewAction,
      onPopupChange: this.#handlePopupChange,
      filmsModel: this.#filmsModel,
    });
    filmCardPresenter.init(film);
    this.#filmCardPresenterList.set(film.id, filmCardPresenter);
  };

  #renderLoading() {
    render(this.#loadingComponent, mainElement);
  }

  init = () => {
    this.#renderMainFilmsContainer();
  };

}
