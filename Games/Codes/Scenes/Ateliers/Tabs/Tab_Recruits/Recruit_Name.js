// ================================================================
//  Recruit_Name.js
//  경로: Games/Codes/Scenes/Ateliers/Tabs/Tab_Recruits/Recruit_Name.js
//
//  역할: 커스텀 화면의 이름 인라인 편집 필드
//        클릭 → Phaser 커서 깜빡임 + keydown 수신
//        유효성: 한글 완성형 1글자 이상
//  의존: Tab_Recruit.js(this)
// ================================================================

Tab_Recruit.prototype._buildNameField = function (cx, y, bw) {
  const { scene, result } = this;
  const fW = bw * 0.80;
  const fH = parseInt(this._fs(22));

  this._nameEditing  = false;
  this._nameBuffer   = result.name;
  this._nameCursorOn = false;

  // 배경
  const fbg = scene.add.graphics();
  this._drawNameField = (state) => {
    fbg.clear();
    fbg.fillStyle(state === 'edit' ? 0x2a1408 : 0x1e1008, 1);
    fbg.lineStyle(1,
      state === 'edit'  ? 0xc87030 :
      state === 'hover' ? 0xa05018 : 0x3d2010, 1);
    fbg.fillRect(cx - fW/2, y - fH/2, fW, fH);
    fbg.strokeRect(cx - fW/2, y - fH/2, fW, fH);
  };
  this._drawNameField('normal');
  this._container.add(fbg);

  // 이름 텍스트
  this._nameTxt = scene.add.text(cx, y, result.name, {
    fontSize: this._fs(12), fill: '#c8a070', fontFamily: FontManager.MONO,
  }).setOrigin(0.5);
  this._container.add(this._nameTxt);

  // 히트 영역
  const hit = scene.add.rectangle(cx, y, fW, fH, 0, 0)
    .setInteractive({ useHandCursor: true });
  this._container.add(hit);
  hit.on('pointerover',  () => { if (!this._nameEditing) this._drawNameField('hover'); });
  hit.on('pointerout',   () => { if (!this._nameEditing) this._drawNameField('normal'); });
  hit.on('pointerdown',  () => this._startNameEdit());

  // 필드 바깥 클릭 → 확정
  scene.input.on('pointerdown', (ptr) => {
    if (!this._nameEditing) return;
    if (Math.abs(ptr.x - cx) > fW/2 || Math.abs(ptr.y - y) > fH/2) {
      this._commitNameEdit();
    }
  });
};

Tab_Recruit.prototype._startNameEdit = function () {
  if (this._nameEditing) return;
  this._nameEditing = true;
  this._nameBuffer  = this.result.name;
  this._drawNameField('edit');

  // 커서 점멸
  this._nameCursorTimer = this.scene.time.addEvent({
    delay: 500, loop: true,
    callback: () => {
      if (!this._nameEditing) return;
      this._nameCursorOn = !this._nameCursorOn;
      this._refreshNameTxt();
    },
  });

  // 키보드 수신
  this._nameKeyHandler = (evt) => {
    if (!this._nameEditing) return;
    const key = evt.key;
    if (key === 'Enter' || key === 'Escape') {
      this._commitNameEdit();
    } else if (key === 'Backspace') {
      if (this._nameBuffer.length > 0)
        this._nameBuffer = [...this._nameBuffer].slice(0, -1).join('');
      this._refreshNameTxt();
    } else if (key.length === 1 && this._nameBuffer.length < 10) {
      this._nameBuffer += key;
      this._refreshNameTxt();
    }
  };
  window.addEventListener('keydown', this._nameKeyHandler);
  this._refreshNameTxt();
};

Tab_Recruit.prototype._refreshNameTxt = function () {
  const cursor = this._nameEditing && this._nameCursorOn ? '|' : '';
  this._nameTxt.setText(this._nameBuffer + cursor);
};

Tab_Recruit.prototype._commitNameEdit = function () {
  if (!this._nameEditing) return;
  this._nameEditing = false;
  if (this._nameCursorTimer) { this._nameCursorTimer.remove(); this._nameCursorTimer = null; }
  if (this._nameKeyHandler)  { window.removeEventListener('keydown', this._nameKeyHandler); this._nameKeyHandler = null; }

  const v = this._nameBuffer.trim();
  // 유효성: 한글 완성형 1글자 이상
  if (/^[가-힣]+$/.test(v)) {
    this.result.name = v;
  } else {
    this._nameBuffer = this.result.name;
    if (v && v !== this.result.name) this._toast('이름은 한글 완성형으로 입력하십시오');
  }
  this._nameTxt.setText(this.result.name);
  this._drawNameField('normal');
};
