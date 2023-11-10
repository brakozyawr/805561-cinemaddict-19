import PopupWrapperView from '../view/popup-wrapper-view.js';
import PopupInnerView from '../view/popup-inner-view.js';
import PopupFilmContainerView from '../view/popup-film-container-view.js';
import PopupCommentsContainerView from '../view/popup-comments-container-view.js';
import {render, remove} from '../framework/render';
import {UpdateType, UserAction} from '../const';

export default class PopupPresenter {
  #popupContainer = null;
  #commentModel = null;
  #filmsModel = null;
  #comments = null;
  #popupFilmContainer = null;
  #popupCommentsContainer = null;

  #PopupWrapperComponent = new PopupWrapperView;
  #PopupInnerComponent = new PopupInnerView;
  bodyElement = document.body;
  #clearPopupPresenterList = null;

  constructor({popupContainer, commentModel, filmsModel}, clearPopupPresenterList) {
    this.#popupContainer = popupContainer;
    this.#commentModel = commentModel;
    this.#filmsModel = filmsModel;
    this.#clearPopupPresenterList = clearPopupPresenterList;

    this.#commentModel.addObserver(this.#reinitFilmsModel);
    //this.#filmsModel.addObserver(this.#handleModelEvent);
    //this.#filmsModel.addObserver(console.log(`обновилась filmsModel в PopupPresenter` ));
  }

  init = (film) => {
    //this.#clearPopupPresenterList();
    this.#renderPopup(film);
  };

  #renderPopup = (film) => {
    this.#comments = [...this.#commentModel.comments];

    this.#popupFilmContainer = new PopupFilmContainerView({
      film: film,
      onClick: this.closePopup,
      onFavoriteClick: this.#handleFavoriteClick,
      onWatchlistClick: this.#handleWatchlistClick,
      onAlreadyWatchedClick: this.#handleAlreadyWatchedClick,
    });

    const commentContainerData = {
      film: film,
      commentsData: this.#comments,
    };
    this.#popupCommentsContainer = new PopupCommentsContainerView({
      commentContainerData,
      onFormSubmit: this.#handleFormSubmit,
      onDeleteClick: this.#handleDeleteClick,
    });

    document.addEventListener('keydown',this.#escKeyDownHandler);

    render(this.#PopupWrapperComponent, this.#popupContainer);
    render(this.#PopupInnerComponent, this.#PopupWrapperComponent.element);
    render(this.#popupFilmContainer, this.#PopupInnerComponent.element);
    render(this.#popupCommentsContainer, this.#PopupInnerComponent.element);

    //this.#popupCommentsContainer.reset();
  };

  #reinitFilmsModel = () => {
    this.#filmsModel.init();
    console.log('reinitFilmsModel');
  };

  rerenderpopupFilmContainer = () => {
    console.log('rerenderpopupFilmContainer');
    //this.#clearPopupPresenterList();
    //const newFilm = this.#filmsModel.films.find((ithem) =>Number(ithem.id) === Number(this.#film.id));
    //console.log(this.#film);
    //console.log(newFilm);
    //this.#film = newFilm;
    //this.init(newFilm);
    remove(this.#popupFilmContainer);
    remove(this.#popupCommentsContainer);
    render(this.#popupFilmContainer, this.#PopupInnerComponent.element);
    render(this.#popupCommentsContainer, this.#PopupInnerComponent.element);
  };

  #handleViewAction = (actionType, updateType, update) => {
    console.log(`handleViewAction ${ actionType}` );
    switch (actionType) {
      case UserAction.ADD_COMMENT:
        this.#commentModel.addComment(updateType, update);
        break;
      case UserAction.DELETE_COMMENT:
        this.#commentModel.deleteComment(updateType, update);
        break;
      case UserAction.UPDATE_FILM_CARD_DETAIL:
        this.#filmsModel.updateFilm(updateType, update);
        break;
    }
  };

  /*#handleModelEvent = (updateType, ) => {
    console.log('handleModelEvent');
    switch (updateType) {
      case UpdateType.MINOR:
        this.rerenderpopupFilmContainer();
        //console.log('handleModelEvent MINOR');
        break;
      case UpdateType.MAJOR:
        this.rerenderpopupFilmContainer();
        //console.log('handleModelEvent MAJOR');
        break;
    }
  };*/

  closePopup = () => {
    this.destroy();
    this.bodyElement.classList.remove('hide-overflow');
    document.removeEventListener('keydown',this.#escKeyDownHandler);
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.closePopup();
    }
    const isCtrlCmd = evt.ctrlKey || evt.metaKey;
    const isEnter = evt.key === 'Enter' || evt.key === 'Enter';
    if (isCtrlCmd && isEnter ) {
      this.#popupCommentsContainer.commentSendHandler();
      this.#popupCommentsContainer.reset();
    }
  };

  #handleFormSubmit = (update) => {
    //this.#handleDataChange(
    this.#handleViewAction(
      UserAction.ADD_COMMENT,
      UpdateType.MAJOR,
      update,
    );
  };

  #handleDeleteClick = (commentId) => {
    //this.#handleDataChange(
    this.#handleViewAction(
      UserAction.DELETE_COMMENT,
      UpdateType.MINOR,
      commentId,
    );
  };

  #handleFavoriteClick = (film) => {
    const newFilm = structuredClone(film);
    const {userDetails} = film;

    //this.#handleDataChange(
    this.#handleViewAction(
      UserAction.UPDATE_FILM_CARD_DETAIL,
      UpdateType.MAJOR,
      {...newFilm, userDetails: {...userDetails, favorite: !film.userDetails.favorite } },
    );
  };

  #handleWatchlistClick = (film) => {
    const newFilm = structuredClone(film);
    const {userDetails} = film;

    //this.#handleDataChange(
    this.#handleViewAction(
      UserAction.UPDATE_FILM_CARD_DETAIL,
      UpdateType.MAJOR,
      {...newFilm, userDetails: {...userDetails, watchlist: !film.userDetails.watchlist } },
    );
  };

  #handleAlreadyWatchedClick = (film) => {
    const newFilm = structuredClone(film);
    const {userDetails} = film;
    //this.#handleDataChange(
    this.#handleViewAction(
      UserAction.UPDATE_FILM_CARD_DETAIL,
      UpdateType.MAJOR,
      {...newFilm, userDetails: {...userDetails, alreadyWatched: !film.userDetails.alreadyWatched } },
    );
  };

  destroy = () =>{
    remove(this.#PopupWrapperComponent);
    remove(this.#PopupInnerComponent);
    remove(this.#popupFilmContainer);
    remove(this.#popupCommentsContainer);
  };
}
