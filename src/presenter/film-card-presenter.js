import {render, remove, replace} from '../framework/render';
import {UserAction, UpdateType, END_POINT, AUTHORIZATION} from '../const.js';
import PopupPresenter from './popup-presenter';
import FilmCardView from '../view/film-card-view';
import CommentModel from '../model/comment-model';
import CommentsApiService from '../comments-api-service';


const bodyElement = document.body;
//const isActive = false;

export default class FilmCardPresenter {
  #commentModel = new CommentModel({
    commentsApiService: new CommentsApiService(END_POINT, AUTHORIZATION)
  });

  #filmsModel = null;
  #film = null;
  #handleDataChange = null;
  #popupPresenter = null;
  #filmsListContainer = null;
  #filmComponent = null;
  #handlePopupChange = null;
  #PopupPresenterList = new Map();

  constructor({filmsListContainer, onDataChange, onPopupChange, filmsModel }) {
    this.#filmsListContainer = filmsListContainer;
    this.#handleDataChange = onDataChange;
    this.#handlePopupChange = onPopupChange;
    this.#filmsModel = filmsModel;

    this.#filmsModel.addObserver(this.#handleModelEvent);
    //this.#filmsModel.addObserver(console.log(`обновилась filmsModel в FilmCardPresenter` ));
  }

  #rerenderpopup = () => {
    if (this.#film){
      console.log('перерисуем попап');
      console.log(this.#film);
      this.#PopupPresenterList.forEach((presenter) => presenter.destroy());
      this.#PopupPresenterList.forEach((presenter) => presenter.closePopup());

      this.#popupChangeHendler();
      //this.#PopupPresenterList.clear();
      this.removePopup();
      //this.#popupPresenter.destroy();
      const newFilm = this.#filmsModel.films.find((ithem) =>Number(ithem.id) === Number(this.#film.id));
      console.log(newFilm);
      this.#popupPresenter.init(newFilm).rerenderpopupFilmContainer();
      //this.#popupPresenter.rerenderpopupFilmContainer();
      //bodyElement.classList.add('hide-overflow');
      //this.#film = null;
    }
  };

  #clearPopupPresenterList= () =>{
    this.#PopupPresenterList.forEach((presenter) => presenter.destroy());
    this.#PopupPresenterList.forEach((presenter) => presenter.closePopup());
    this.#PopupPresenterList.clear();
    //this.#popupChangeHendler();
  }

  #handleModelEvent = (updateType, data) => {
    //console.log('обновилась filmsModel в films-presenter' );
    switch (updateType) {
      case UpdateType.MAJOR:
        this.#rerenderpopup();
        break;
    }
  };

  #openPopup = (film) => {
    this.#film = film;
    this.#clearPopupPresenterList();
    this.#popupChangeHendler();//закрывает открытые ранее попапы, очищает список FilmCardPresenter методом removePopup
    this.#popupPresenter.init(film);
    bodyElement.classList.add('hide-overflow');
  };

  removePopup() {
    this.#popupPresenter.closePopup();
  }

  init = (film) => {
    this.#commentModel.init(film);

    this.#popupPresenter = new PopupPresenter({
      popupContainer: bodyElement,
      commentModel: this.#commentModel,
      filmsModel: this.#filmsModel,
      clearPopupPresenterList: this.#clearPopupPresenterList
    });
    this.#PopupPresenterList.set(film.id, this.#popupPresenter);

    const prevFilmComponent = this.#filmComponent;

    this.#filmComponent = new FilmCardView({
      film,
      onClick: this.#openPopup,
      onFavoriteClick: this.#handleFavoriteClick,
      onWatchlistClick: this.#handleWatchlistClick,
      onAlreadyWatchedClick: this.#handleAlreadyWatchedClick,
    });

    if (prevFilmComponent === null) {
      render(this.#filmComponent, this.#filmsListContainer);
      return;
    }

    if (this.#filmsListContainer.contains(prevFilmComponent.element)) {
      replace(this.#filmComponent, prevFilmComponent);
    }

    remove(prevFilmComponent);
  };

  #handleFavoriteClick = (film) => {
    const newFilm = structuredClone(film);
    const {userDetails} = film;

    this.#handleDataChange(
      UserAction.UPDATE_FILM_CARD,
      UpdateType.MAJOR,
      {...newFilm, userDetails: {...userDetails, favorite: !film.userDetails.favorite } },
    );
  };

  #handleWatchlistClick = (film) => {
    const newFilm = structuredClone(film);
    const {userDetails} = film;

    this.#handleDataChange(
      UserAction.UPDATE_FILM_CARD,
      UpdateType.MAJOR,
      {...newFilm, userDetails: {...userDetails, watchlist: !film.userDetails.watchlist } },
    );
  };

  #handleAlreadyWatchedClick = (film) => {
    const newFilm = structuredClone(film);
    const {userDetails} = film;

    this.#handleDataChange(
      UserAction.UPDATE_FILM_CARD,
      UpdateType.MAJOR,
      {...newFilm, userDetails: {...userDetails, alreadyWatched: !film.userDetails.alreadyWatched } },
    );
  };

  #popupChangeHendler = () => {
    this.#handlePopupChange();
  };

  destroy() {
    remove(this.#filmComponent);
  }

}
