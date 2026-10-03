// PRH-rajapintojen vastausten muotoiset testiaineistot (rakenne PRH:n v3-skeeman mukaan).

import type { RawCompany } from '../src/lib/prh';

export const activeCompany: RawCompany = {
  businessId: { value: '0112038-9', registrationDate: '1978-03-15' },
  names: [
    { name: 'Nokia Oyj', type: '1', registrationDate: '1997-09-01' },
    { name: 'Nokia Aktiebolag', type: '3', registrationDate: '1997-09-01' },
    { name: 'Oy Nokia Ab', type: '1', registrationDate: '1966-01-01', endDate: '1997-08-31' },
  ],
  mainBusinessLine: {
    type: '70100',
    descriptions: [
      { languageCode: '3', description: 'Activities of head offices' },
      { languageCode: '1', description: 'Pääkonttorien toiminta' },
    ],
  },
  website: { url: 'www.nokia.com' },
  companyForms: [{ type: '17', descriptions: [{ languageCode: '1', description: 'Julkinen osakeyhtiö' }] }],
  companySituations: [],
  registeredEntries: [
    { type: '1', register: '1', descriptions: [{ languageCode: '1', description: 'Rekisterissä' }], registrationDate: '1896-12-19' },
    { type: '1', register: '5', descriptions: [{ languageCode: '1', description: 'Rekisterissä' }], registrationDate: '1978-03-15' },
    { type: '1', register: '6', descriptions: [{ languageCode: '1', description: 'Rekisterissä' }], registrationDate: '1994-06-01' },
    { type: '1', register: '7', descriptions: [{ languageCode: '1', description: 'Rekisterissä' }], registrationDate: '1978-03-15' },
  ],
  addresses: [
    { type: 1, street: 'Karakaari', buildingNumber: '7', postCode: '02610', postOffices: [{ city: 'ESPOO', languageCode: '1' }, { city: 'ESBO', languageCode: '2' }] },
    { type: 2, postOfficeBox: '226', postCode: '00045', postOffices: [{ city: 'NOKIA GROUP', languageCode: '1' }] },
  ],
  tradeRegisterStatus: '1',
  status: '2',
  registrationDate: '1896-12-19',
  lastModified: '2025-12-31 07:39:20',
};

export const bankruptCompany: RawCompany = {
  businessId: { value: '1234567-1' },
  names: [{ name: 'Huono Rakennus Oy', type: '1', registrationDate: '2025-11-01' }],
  companyForms: [{ type: '16', descriptions: [{ languageCode: '1', description: 'Osakeyhtiö' }] }],
  companySituations: [{ type: 'KONK', registrationDate: '2026-08-12' }],
  registeredEntries: [
    { type: '1', register: '1', descriptions: [{ languageCode: '1', description: 'Rekisterissä' }] },
    { type: '1', register: '5', descriptions: [{ languageCode: '1', description: 'Rekisterissä' }], endDate: '2026-08-12' },
  ],
  addresses: [],
  tradeRegisterStatus: '1',
  status: '2',
  registrationDate: '2025-11-01',
};

/** Pienennetty XBRL-tilinpäätös: kuluva tilikausi 2024 ja vertailuvuosi 2023. */
export const xbrl = `<?xml version="1.0" encoding="UTF-8"?>
<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:xbrldi="http://xbrl.org/2006/xbrldi"
  xmlns:fi_met="http://www.sbr.fi/met" xmlns:fi_dim="http://www.sbr.fi/dim" xmlns:fi_MC="http://www.sbr.fi/mc">
  <xbrli:context id="d_rev"><xbrli:entity><xbrli:identifier scheme="x">1</xbrli:identifier></xbrli:entity>
    <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="fi_dim:MCY">fi_MC:x673</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
  <xbrli:context id="d_rev_prev"><xbrli:entity><xbrli:identifier scheme="x">1</xbrli:identifier></xbrli:entity>
    <xbrli:period><xbrli:startDate>2023-01-01</xbrli:startDate><xbrli:endDate>2023-12-31</xbrli:endDate></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="fi_dim:MCY">fi_MC:x673</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
  <xbrli:context id="d_op"><xbrli:entity><xbrli:identifier scheme="x">1</xbrli:identifier></xbrli:entity>
    <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="fi_dim:MCY">fi_MC:x689</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
  <xbrli:context id="d_net"><xbrli:entity><xbrli:identifier scheme="x">1</xbrli:identifier></xbrli:entity>
    <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="fi_dim:MCY">fi_MC:x740</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
  <xbrli:context id="i_assets"><xbrli:entity><xbrli:identifier scheme="x">1</xbrli:identifier></xbrli:entity>
    <xbrli:period><xbrli:instant>2024-12-31</xbrli:instant></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="fi_dim:MCY">fi_MC:x360</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
  <xbrli:context id="i_equity"><xbrli:entity><xbrli:identifier scheme="x">1</xbrli:identifier></xbrli:entity>
    <xbrli:period><xbrli:instant>2024-12-31</xbrli:instant></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="fi_dim:MCY">fi_MC:x376</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
  <fi_met:si289 contextRef="i_assets">2345678-0</fi_met:si289>
  <fi_met:di120 contextRef="i_assets">2024-01-01</fi_met:di120>
  <fi_met:di121 contextRef="i_assets">2024-12-31</fi_met:di121>
  <fi_met:md103 contextRef="d_rev_prev" unitRef="EUR" decimals="0">900000</fi_met:md103>
  <fi_met:md103 contextRef="d_rev" unitRef="EUR" decimals="0">1250000</fi_met:md103>
  <fi_met:md103 contextRef="d_op" unitRef="EUR" decimals="0">125000</fi_met:md103>
  <fi_met:md103 contextRef="d_net" unitRef="EUR" decimals="0">-15000</fi_met:md103>
  <fi_met:mi53 contextRef="i_assets" unitRef="EUR" decimals="0">800000</fi_met:mi53>
  <fi_met:mi53 contextRef="i_equity" unitRef="EUR" decimals="0">120000</fi_met:mi53>
</xbrli:xbrl>`;
