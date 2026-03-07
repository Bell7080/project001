// ================================================================
//  Recruit_Pick.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Pick.js
//
//  역할: Phase 3 — 카드 선택
//        실제 전환 연출은 Recruit_Slot.js의 _flipToPick() 이 담당.
//        _buildPick 은 직접 호출될 경우를 위한 폴백으로만 유지.
//  의존: Recruit_Data.js, Tab_Recruit.js(this)
// ================================================================

Tab_Recruit.prototype._buildPick = function () {
  // 슬롯에서 정상 흐름이면 _flipToPick() 이 호출되므로 여기엔 오지 않음.
  // 혹시 직접 호출되는 경우를 대비한 폴백.
  this._flipToPick();
};
