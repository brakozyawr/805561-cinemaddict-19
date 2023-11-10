import Observable from '../framework/observable.js';


export default class CommentModel extends Observable {
  #commentsApiService = null;
  #comments = [];

  constructor({commentsApiService}) {
    super();
    this.#commentsApiService = commentsApiService;
  }

  get comments() {
    return this.#comments;
  }

  async init(film) {
    try {
      const comments = await this.#commentsApiService.getComments(film);

      this.#comments = comments;
    } catch(err) {
      this.#comments = [];
    }
  }

  async addComment(updateType, update) {
    try {
      const response = await this.#commentsApiService.addComment(update);
      this.#comments = [response, ...this.#comments];

      this._notify(updateType, response);
    } catch (err) {
      throw new Error('Can\'t add comment');
    }
  }

  async deleteComment(updateType, update){

    const index = this.#comments.findIndex((comment) => Number(comment.id) === Number(update));

    if (index === -1) {
      throw new Error('Can\'t delete unexisting comment');
    }

    try {
      await this.#commentsApiService.deleteComment(update);
      this.#comments = [
        ...this.#comments.slice(0, index),
        ...this.#comments.slice(index + 1),
      ];
      this._notify(updateType);

    } catch(err) {
      throw new Error('Can\'t delete comment');
    }
  }

}
