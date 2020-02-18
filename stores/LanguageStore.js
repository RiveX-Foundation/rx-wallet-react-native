import { action, observable } from 'mobx';

class LanguageStore {
  @observable language = "en_US";
 
  @action setLanguage(language) {
    // console.log("setLanguage", language)
    this.language = language;
  }
}

const languageStore = new LanguageStore();
export default languageStore;