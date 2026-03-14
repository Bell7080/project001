// ================================================================
//  Settings_Tab_Save.js
//  경로: Games/Codes/Scenes/Settings/Settings_Tab_Save.js
//
//  역할: 설정 > 저장 탭 (저장 코드 내보내기 / 불러오기 / 초기화)
//  호출: Settings_Tab_Save.build(scene, W, H, cx)
//  의존: FontManager, SaveManager, InputManager, AudioManager, utils.js
//        scene.makeButton / scene.showConfirmPopup / scene.showToast
//        scene.fromScene / scene._cursorTimer (cleanup용)
//
//  ✏️ 수정 내역 (초기화 버그)
//    · SaveManager.reset() 메서드가 존재하지 않아 초기화 버튼을 누르면
//      TypeError가 발생해 아무것도 지워지지 않던 버그 수정
//    · _buildReset 콜백에서 SaveManager의 실제 존재하는 메서드로 교체:
//        SaveManager.reset()      → SaveManager.deleteSave()
//        SaveManager.deleteSettings() 그대로 유지
//        CharacterManager.saveAll([]) 추가 — 캐릭터 데이터도 초기화
//    · 초기화 대상 localStorage 키 목록:
//        neural_rust_save / neural_rust_settings / neural_rust_story
//        neural_rust_keybinds / neural_rust_audio / settings_font
//        nr_characters / nr_squad
//    · 폰트/텍스트 크기는 이전 수정값 유지
//        섹션 라벨: 18, 코드/입력창: 16, 커서: 17
//        rowH: btnH * 1.1, 표시 글자수: 50
//        startY: H * 0.310
// ================================================================

const Settings_Tab_Save = {

  build(scene, W, H, cx) {
    const marginX   = W * 0.06;
    const boxW      = W * 0.76;
    const btnW      = W * 0.09;
    const btnH      = Math.max(28, Math.round(H * 0.055));
    const rightBtnX = marginX + boxW + (W * 0.94 - (marginX + boxW)) / 2;
    const startY    = H * 0.310;
    const secGap    = H * 0.055;

    const exportEndY = this._buildExportCode(scene, W, H, cx, marginX, boxW, btnW, btnH, rightBtnX, startY);
    const importEndY = this._buildImportCode(scene, W, H, cx, marginX, boxW, btnW, btnH, rightBtnX, exportEndY + secGap);
    this._buildReset(scene, W, H, cx, marginX, boxW, btnW, btnH, rightBtnX, importEndY + secGap);
  },

  _buildExportCode(scene, W, H, cx, marginX, boxW, btnW, btnH, rightBtnX, startY) {
    const sectionY = startY;
    const rowH     = Math.round(btnH * 1.1);
    const rowY     = sectionY + H * 0.038;

    scene.add.text(marginX, sectionY, '[ 내 저장 코드 ]', {
      fontSize: scaledFontSize(18, scene.scale),
      fill: '#5a3518',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    const gameData     = SaveManager.load();
    const settingsData = SaveManager.loadSettings();
    const exportCode   = btoa(unescape(encodeURIComponent(JSON.stringify({ game: gameData, settings: settingsData }))));

    const codeBox = scene.add.graphics();
    codeBox.fillStyle(0x0e0a06, 1);
    codeBox.lineStyle(1, 0x2a1a0a, 0.8);
    codeBox.strokeRect(marginX, rowY, boxW, rowH);
    codeBox.fillRect(marginX, rowY, boxW, rowH);

    const display = exportCode.length > 50 ? exportCode.substring(0, 50) + '…' : exportCode;
    scene.add.text(marginX + W * 0.012, rowY + rowH / 2, display, {
      fontSize: scaledFontSize(16, scene.scale),
      fill: '#5a3820',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    scene.makeButton(rightBtnX, rowY + rowH / 2, btnW, rowH, '복사', () => {
      navigator.clipboard?.writeText(exportCode)
        .then(() => scene.showToast(cx, H * 0.5, '복사 완료'))
        .catch(() => scene.showToast(cx, H * 0.5, '수동으로 복사해주세요'));
    });

    return rowY + rowH;
  },

  _buildImportCode(scene, W, H, cx, marginX, boxW, btnW, btnH, rightBtnX, startY) {
    const sectionY = startY;
    const rowH     = Math.round(btnH * 1.1);
    const inputY   = sectionY + H * 0.038;

    scene.add.text(marginX, sectionY, '[ 저장 코드로 불러오기 ]', {
      fontSize: scaledFontSize(18, scene.scale),
      fill: '#5a3518',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    const inputBg = scene.add.graphics();
    const drawInputBg = (focused) => {
      inputBg.clear();
      inputBg.fillStyle(0x0e0a06, 1);
      inputBg.lineStyle(1, focused ? 0x6b3820 : 0x2a1a0a, focused ? 1 : 0.8);
      inputBg.strokeRect(marginX, inputY, boxW, rowH);
      inputBg.fillRect(marginX, inputY, boxW, rowH);
    };
    drawInputBg(false);

    let inputValue    = '';
    const placeholder = '여기에 저장 코드를 입력하세요…';

    const inputText = scene.add.text(marginX + W * 0.012, inputY + rowH / 2, placeholder, {
      fontSize: scaledFontSize(16, scene.scale),
      fill: '#3d2810',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5).setDepth(10);

    const cursor = scene.add.text(marginX + W * 0.012, inputY + rowH / 2, '|', {
      fontSize: scaledFontSize(17, scene.scale),
      fill: '#8a6040',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5).setDepth(10).setAlpha(0);

    let cursorVisible = false;
    let focused       = false;

    scene._cursorTimer = scene.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        cursorVisible = !cursorVisible;
        if (inputValue.length > 0 && focused) cursor.setAlpha(cursorVisible ? 1 : 0);
      },
    });

    const updateDisplay = () => {
      if (inputValue === '') {
        inputText.setText(placeholder).setStyle({ fill: '#3d2810' });
        cursor.setAlpha(0);
      } else {
        const shown = inputValue.length > 50 ? inputValue.substring(0, 50) + '…' : inputValue;
        inputText.setText(shown).setStyle({ fill: '#7a5028' });
        cursor.setX(marginX + W * 0.012 + inputText.width + 2);
      }
    };

    const hitInput = scene.add.rectangle(marginX + boxW / 2, inputY + rowH / 2, boxW, rowH, 0x000000, 0)
      .setDepth(10).setInteractive({ useHandCursor: true });

    hitInput.on('pointerdown', () => { focused = true;  drawInputBg(true); });
    scene.input.on('pointerdown', (ptr, objs) => {
      if (!objs.includes(hitInput)) { focused = false; drawInputBg(false); }
    });

    scene.input.keyboard.on('keydown', (e) => {
      if (!focused) return;
      if (e.key === 'Backspace') inputValue = inputValue.slice(0, -1);
      else if (e.key.length === 1) inputValue += e.key;
      updateDisplay();
    });
    scene.input.keyboard.on('keydown-V', (e) => {
      if (!focused) return;
      if (e.ctrlKey || e.metaKey) {
        navigator.clipboard?.readText().then(text => { inputValue = text.trim(); updateDisplay(); });
      }
    });

    scene.makeButton(rightBtnX, inputY + rowH / 2, btnW, rowH, '로드', () => {
      const val = inputValue.trim();
      if (!val) { scene.showToast(cx, H * 0.5, '코드를 입력해주세요'); return; }
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(val))));
        if (decoded.game)     SaveManager.save(decoded.game);
        if (decoded.settings) {
          SaveManager.saveSettings(decoded.settings);
          if (decoded.settings.font) {
            localStorage.setItem('settings_font', decoded.settings.font);
            FontManager.setActive(decoded.settings.font);
          }
        }
        scene.showToast(cx, H * 0.5, '불러오기 완료');
      } catch (e) {
        scene.showToast(cx, H * 0.5, '잘못된 코드입니다');
      }
    });

    return inputY + rowH;
  },

  _buildReset(scene, W, H, cx, marginX, boxW, btnW, btnH, rightBtnX, startY) {
    const sectionY = startY;

    const sep = scene.add.graphics();
    sep.lineStyle(1, 0x221508, 0.8);
    sep.lineBetween(marginX, sectionY - H * 0.02, marginX + boxW + btnW + W * 0.04, sectionY - H * 0.02);

    scene.add.text(marginX, sectionY, '[ 초기화 ]', {
      fontSize: scaledFontSize(18, scene.scale),
      fill: '#5a3518',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    scene.add.text(marginX, sectionY + H * 0.038, '모든 저장 데이터와 설정을 삭제합니다', {
      fontSize: scaledFontSize(13, scene.scale),
      fill: '#4a2810',
      fontFamily: FontManager.MONO,
    }).setOrigin(0, 0.5);

    scene.makeButton(rightBtnX, sectionY + H * 0.019, btnW, btnH, '초기화', () => {
      scene.showConfirmPopup(cx, H, '모든 데이터를 초기화하겠습니까?', () => {

        // ✏️ 버그 수정: SaveManager.reset()은 존재하지 않음
        //    → 실제 존재하는 메서드로 각 키 개별 삭제
        SaveManager.deleteSave();
        SaveManager.deleteSettings();

        // 스토리 데이터
        localStorage.removeItem(SaveManager.STORY_KEY);

        // 키 바인딩
        InputManager.resetToDefaults();

        // 오디오 설정 — resetToDefaults가 있으면 호출, 없으면 직접 삭제
        if (typeof AudioManager.resetToDefaults === 'function') {
          AudioManager.resetToDefaults();
        } else {
          localStorage.removeItem('neural_rust_audio');
        }

        // 폰트 선택
        localStorage.removeItem('settings_font');

        // 캐릭터 데이터
        if (typeof CharacterManager !== 'undefined') {
          CharacterManager.saveAll([]);
        }
        localStorage.removeItem('nr_squad');
        localStorage.removeItem('nr_record_chips');
        localStorage.removeItem('nr_party');

        scene.showToast(cx, H * 0.5, '초기화 완료', () => {
          scene.scene.start('LobbyScene');
        });
      });
    }, true);
  },
};
