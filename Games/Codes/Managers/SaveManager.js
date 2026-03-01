// ================================================================
//  SaveManager.js
//  경로: Games/Codes/Managers/SaveManager.js
//
//  역할: 게임 세이브 데이터 관리 (localStorage 기반)
// ================================================================

const SaveManager = {
  SAVE_KEY: 'project001_save',

  hasSave()    { return localStorage.getItem(this.SAVE_KEY) !== null; },
  save(data)   { localStorage.setItem(this.SAVE_KEY, JSON.stringify(data)); },
  load()       { const r = localStorage.getItem(this.SAVE_KEY); return r ? JSON.parse(r) : null; },
  deleteSave() { localStorage.removeItem(this.SAVE_KEY); },
};
