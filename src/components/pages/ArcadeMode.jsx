import React from 'react';
import PartnerMode from './PartnerMode';
import AppleAllClear from './AppleAllClear';

const ArcadeMode = ({ mode, onBack }) => {
  switch(mode) {
    case 'partner':
      return <PartnerMode onBack={onBack} />;
    case 'allClear':
      return <AppleAllClear onBack={onBack} />;
    default:
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>모드를 선택해주세요</h2>
          <button onClick={onBack}>뒤로가기</button>
        </div>
      );
  }
};

export default ArcadeMode;
