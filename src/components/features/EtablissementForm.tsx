'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import type { Programme, Prestation, EtablissementCentre } from '@/lib/models/etablissement.model';
import type { Region, Province } from '@/lib/models/geo.model';

const ESRI_WORLD_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

interface Personnel {
  id: number;
  nom: string;
  prenom: string;
}

interface FormState {
  nomFr: string;
  nomAr: string;
  code: string;
  telephone: string;
  fax: string;
  adresse: string;
  personneResponsableCentre: string;
  milieu: string;
  typeLocal: string;
  utilisation: string;
  loyer: string;
  paieLoyer: string;
  montantLoyer: string;
  etatConstruction: string;
  regionId: string;
  provinceId: string;
  latitude: string;
  longitude: string;
  proprietecentre: string;
  numerotitre: string;
  dateAchat: string;
  dateExploitation: string;
  dateConstruction: string;
  superficieTerrain: string;
  surfaceBatie: string;
  superficieTotaleEtages: string;
  nombreEtage: string;
  composant: string;
  etagesUtilises: string;
  observation: string;
  raccordementEauPotable: string;
  raccordementElectricite: string;
  planSituation: string;
  planArchitecture: string;
  litige: string;
  raisonsConflit: string;
  prixBatiment: string;
  capaciteAccueil: string;
  gererPar: string;
  autorise: string;
  numeroAutorisation: string;
}

const EMPTY_FORM: FormState = {
  nomFr: '', nomAr: '', code: '', telephone: '', fax: '', adresse: '',
  personneResponsableCentre: '', milieu: '', typeLocal: '', utilisation: '',
  loyer: '', paieLoyer: '', montantLoyer: '', etatConstruction: '',
  regionId: '', provinceId: '', latitude: '', longitude: '',
  proprietecentre: '', numerotitre: '', dateAchat: '', dateExploitation: '', dateConstruction: '',
  superficieTerrain: '', surfaceBatie: '', superficieTotaleEtages: '', nombreEtage: '',
  composant: '', etagesUtilises: '', observation: '',
  raccordementEauPotable: '', raccordementElectricite: '', planSituation: '', planArchitecture: '',
  litige: '', raisonsConflit: '', prixBatiment: '', capaciteAccueil: '', gererPar: '',
  autorise: '', numeroAutorisation: ''
};

function boolToStr(v: boolean | null | undefined): string {
  return v === true ? 'true' : v === false ? 'false' : '';
}

function strToBool(v: string): boolean | undefined {
  return v === 'true' ? true : v === 'false' ? false : undefined;
}

function numToStr(v: number | null | undefined): string {
  return v === null || v === undefined ? '' : String(v);
}

function strToNum(v: string): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function toDateInputValue(v: string | null | undefined): string {
  return v ? String(v).slice(0, 10) : '';
}

function normalizeLng(lng: number): number {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}

export default function EtablissementForm({ id }: { id?: string }) {
  const isEdit = !!id;
  const router = useRouter();
  const { t } = useI18n();
  const { hasRole, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);

  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<number[]>([]);
  const [selectedProgrammes, setSelectedProgrammes] = useState<Programme[]>([]);
  const [prestationsMap, setPrestationsMap] = useState<Record<number, Prestation[]>>({});
  const [selectedPrestationIds, setSelectedPrestationIds] = useState<number[]>([]);

  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [existingFiles, setExistingFiles] = useState<{ mappeCadastrale: string; certificatPropriete: string }>({
    mappeCadastrale: '',
    certificatPropriete: ''
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapInitializedRef = useRef(false);

  function restrictToOwnProvince(): boolean {
    return hasRole('ROLE_DELEGUE');
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function markTouched(key: string) {
    setTouched(t2 => ({ ...t2, [key]: true }));
  }

  // ---- Load reference data ----
  useEffect(() => {
    api.getRegions().then((r: Region[]) => {
      const restricted = restrictToOwnProvince();
      const regionId = user?.regionId;
      setRegions(restricted && regionId ? r.filter(x => x.id === regionId) : restricted ? [] : [...r]);
    }).catch(() => {});

    api.getProvinces().then((p: Province[]) => {
      const restricted = restrictToOwnProvince();
      const provinceId = user?.provinceId;
      const list = restricted && provinceId ? p.filter(x => x.id === provinceId) : restricted ? [] : [...p];
      setProvinces(list);
      setFilteredProvinces(list);
    }).catch(() => {});

    api.getProgrammes().then((p: Programme[]) => setProgrammes([...p])).catch(() => {});
    api.getPersonnel().then((p: Personnel[]) => setPersonnel([...p])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Pre-fill region/province for a DELEGUE creating a new établissement ----
  useEffect(() => {
    if (!isEdit && restrictToOwnProvince()) {
      setForm(f => ({
        ...f,
        regionId: numToStr(user?.regionId),
        provinceId: numToStr(user?.provinceId)
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Edit: load the existing établissement ----
  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    setLoading(true);
    api.getEtablissement(Number(id)).then((e: EtablissementCentre) => {
      if (cancelled) return;
      setForm({
        nomFr: e.nomFr || '',
        nomAr: e.nomAr || '',
        code: e.code || '',
        telephone: e.telephone || '',
        fax: e.fax || '',
        adresse: e.adresse || '',
        personneResponsableCentre: e.personneResponsableCentre || '',
        milieu: e.milieu || '',
        typeLocal: e.typeLocal || '',
        utilisation: e.utilisation || '',
        loyer: boolToStr(e.loyer),
        paieLoyer: e.paieLoyer || '',
        montantLoyer: numToStr(e.montantLoyer),
        etatConstruction: e.etatConstruction || '',
        regionId: numToStr(e.regionId),
        provinceId: numToStr(e.provinceId),
        latitude: numToStr(e.latitude),
        longitude: numToStr(e.longitude),
        proprietecentre: e.proprietecentre || '',
        numerotitre: e.numerotitre || '',
        dateAchat: toDateInputValue(e.dateAchat),
        dateExploitation: toDateInputValue(e.dateExploitation),
        dateConstruction: toDateInputValue(e.dateConstruction),
        superficieTerrain: numToStr(e.superficieTerrain),
        surfaceBatie: numToStr(e.surfaceBatie),
        superficieTotaleEtages: numToStr(e.superficieTotaleEtages),
        nombreEtage: numToStr(e.nombreEtage),
        composant: e.composant || '',
        etagesUtilises: e.etagesUtilises || '',
        observation: e.observation || '',
        raccordementEauPotable: boolToStr(e.raccordementEauPotable),
        raccordementElectricite: boolToStr(e.raccordementElectricite),
        planSituation: boolToStr(e.planSituation),
        planArchitecture: boolToStr(e.planArchitecture),
        litige: boolToStr(e.litige),
        raisonsConflit: e.raisonsConflit || '',
        prixBatiment: numToStr(e.prixBatiment),
        capaciteAccueil: numToStr(e.capaciteAccueil),
        gererPar: e.gererPar || '',
        autorise: boolToStr(e.autorise),
        numeroAutorisation: e.numeroAutorisation || ''
      });

      if (e.regionId && !restrictToOwnProvince()) {
        api.getProvincesByRegion(e.regionId).then((p: Province[]) => setFilteredProvinces([...p])).catch(() => {});
      }

      if (e.programmes && e.programmes.length > 0) {
        const progs = [...e.programmes];
        setSelectedProgrammes(progs);
        setSelectedProgrammeIds(progs.map(p => +p.id));
        progs.forEach(p => {
          api.getPrestationsByProgramme(p.id).then((pr: Prestation[]) => {
            setPrestationsMap(prev => ({ ...prev, [p.id]: [...pr] }));
          }).catch(() => {});
        });
      }

      if (e.prestationIds) {
        setSelectedPrestationIds([...e.prestationIds]);
      }

      setExistingFiles({
        mappeCadastrale: e.mappeCadastraleUrl || '',
        certificatPropriete: e.certificatProprieteUrl || ''
      });

      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
      router.replace('/etablissements');
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  function onRegionChange(value: string) {
    updateField('regionId', value);
    if (restrictToOwnProvince()) return; // province choice is locked to the DELEGUE's own province
    if (!value) { setFilteredProvinces([...provinces]); return; }
    api.getProvincesByRegion(Number(value)).then((p: Province[]) => setFilteredProvinces([...p])).catch(() => {});
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>, fileType: string) {
    const file = e.target.files?.[0];
    if (file) setPendingFiles(prev => ({ ...prev, [fileType]: file }));
  }

  function getFileUrl(path: string): string {
    return `http://localhost:8080/api/files?path=${path}`;
  }

  // ---- Programmes / prestations ----
  function isProgrammeSelected(progId: number): boolean {
    return selectedProgrammeIds.includes(progId);
  }

  function getPrestationsForProgramme(programmeId: number): Prestation[] {
    return prestationsMap[programmeId] || [];
  }

  function isPrestationSelected(prestationId: number): boolean {
    return selectedPrestationIds.includes(prestationId);
  }

  function togglePrestation(prestationId: number) {
    setSelectedPrestationIds(prev =>
      prev.includes(prestationId) ? prev.filter(id => id !== prestationId) : [...prev, prestationId]
    );
  }

  function toggleProgramme(progId: number, programme: Programme) {
    if (selectedProgrammeIds.includes(progId)) {
      setSelectedProgrammeIds(prev => prev.filter(x => x !== progId));
      setSelectedProgrammes(prev => prev.filter(p => p.id !== progId));
      const prests = prestationsMap[progId] || [];
      const prestIds = prests.map(p => p.id);
      setSelectedPrestationIds(prev => prev.filter(pid => !prestIds.includes(pid)));
    } else {
      setSelectedProgrammeIds(prev => [...prev, progId]);
      setSelectedProgrammes(prev => [...prev, programme]);
      if (!prestationsMap[progId]) {
        api.getPrestationsByProgramme(progId).then((pr: Prestation[]) => {
          setPrestationsMap(prev => ({ ...prev, [progId]: [...pr] }));
        }).catch(() => {});
      }
    }
  }

  // ---- Map ----
  function bindDragEnd() {
    if (!markerRef.current) return;
    markerRef.current.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      const lng = normalizeLng(pos.lng);
      setForm(f => ({
        ...f,
        latitude: String(+pos.lat.toFixed(6)),
        longitude: String(+lng.toFixed(6))
      }));
    });
  }

  function placeOrMoveMarker(lat: number, lng: number) {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(mapRef.current);
      bindDragEnd();
    }
  }

  function initMap() {
    if (mapInitializedRef.current || !mapContainerRef.current) return;
    const lat = parseFloat(form.latitude) || 31.7917;
    const lng = parseFloat(form.longitude) || -7.0926;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      worldCopyJump: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0
    }).setView([lat, lng], 6);

    L.tileLayer(ESRI_WORLD_IMAGERY_URL, {
      attribution: 'Imagery &copy; Esri',
      noWrap: true,
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    if (parseFloat(form.latitude) && parseFloat(form.longitude)) {
      placeOrMoveMarker(lat, lng);
      map.setView([lat, lng], 12);
    }

    map.on('click', (e: any) => {
      const clickLat = e.latlng.lat;
      const clickLng = normalizeLng(e.latlng.lng);
      setForm(f => ({
        ...f,
        latitude: String(+clickLat.toFixed(6)),
        longitude: String(+clickLng.toFixed(6))
      }));
      placeOrMoveMarker(clickLat, clickLng);
    });

    mapInitializedRef.current = true;
  }

  function updateMarker() {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (!lat || !lng || !mapRef.current) return;
    placeOrMoveMarker(lat, lng);
    mapRef.current.setView([lat, lng], 12);
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = +pos.coords.latitude.toFixed(6);
      const lng = +pos.coords.longitude.toFixed(6);
      setForm(f => ({ ...f, latitude: String(lat), longitude: String(lng) }));
      if (mapRef.current) {
        placeOrMoveMarker(lat, lng);
        mapRef.current.setView([lat, lng], 12);
      }
    });
  }

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (!mapInitializedRef.current) initMap();
      else updateMarker();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  // ---- Validation ----
  const nomFrInvalid = !form.nomFr;
  const nomArInvalid = !form.nomAr;
  const provinceInvalid = !form.provinceId;
  const formInvalid = nomFrInvalid || nomArInvalid || provinceInvalid;

  const showLoyerFields = form.loyer === 'true';
  const showLitigeField = form.litige === 'true';
  const showAutoriseField = form.autorise === 'true';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formInvalid) return;
    setSaving(true);

    const data: Record<string, any> = {
      nomFr: form.nomFr,
      nomAr: form.nomAr,
      code: form.code || undefined,
      telephone: form.telephone || undefined,
      fax: form.fax || undefined,
      adresse: form.adresse || undefined,
      personneResponsableCentre: form.personneResponsableCentre || undefined,
      milieu: form.milieu || undefined,
      typeLocal: form.typeLocal || undefined,
      utilisation: form.utilisation || undefined,
      loyer: strToBool(form.loyer),
      paieLoyer: form.paieLoyer || undefined,
      montantLoyer: strToNum(form.montantLoyer),
      etatConstruction: form.etatConstruction || undefined,
      regionId: strToNum(form.regionId),
      provinceId: strToNum(form.provinceId),
      latitude: strToNum(form.latitude),
      longitude: strToNum(form.longitude),
      proprietecentre: form.proprietecentre || undefined,
      numerotitre: form.numerotitre || undefined,
      dateAchat: form.dateAchat || undefined,
      dateExploitation: form.dateExploitation || undefined,
      dateConstruction: form.dateConstruction || undefined,
      superficieTerrain: strToNum(form.superficieTerrain),
      surfaceBatie: strToNum(form.surfaceBatie),
      superficieTotaleEtages: strToNum(form.superficieTotaleEtages),
      nombreEtage: strToNum(form.nombreEtage),
      composant: form.composant || undefined,
      etagesUtilises: form.etagesUtilises || undefined,
      observation: form.observation || undefined,
      raccordementEauPotable: strToBool(form.raccordementEauPotable),
      raccordementElectricite: strToBool(form.raccordementElectricite),
      planSituation: strToBool(form.planSituation),
      planArchitecture: strToBool(form.planArchitecture),
      litige: strToBool(form.litige),
      raisonsConflit: form.raisonsConflit || undefined,
      prixBatiment: strToNum(form.prixBatiment),
      capaciteAccueil: strToNum(form.capaciteAccueil),
      gererPar: form.gererPar || undefined,
      autorise: strToBool(form.autorise),
      numeroAutorisation: form.numeroAutorisation || undefined,
      programmeIds: selectedProgrammeIds,
      prestationIds: selectedPrestationIds
    };

    try {
      const etab = isEdit
        ? await api.updateEtablissement(Number(id), data)
        : await api.createEtablissement(data);

      Object.entries(pendingFiles).forEach(([type, file]) => {
        api.uploadEtablissementFile(etab.id, type, file).catch(() => {});
      });

      showSuccess(t(isEdit ? 'ETABLISSEMENT.FORM.UPDATED' : 'ETABLISSEMENT.FORM.CREATED'));
      router.push('/etablissements');
    } catch (err) {
      setSaving(false);
      showError(err instanceof ApiError ? err.message : t('COMMON.ERROR'));
    }
  }

  const prestationSectionHint = useMemo(() => selectedProgrammes.length === 0, [selectedProgrammes]);

  return (
    <div>
      <div className="page-header">
        <h1>{t(isEdit ? 'ETABLISSEMENT.FORM.TITLE_EDIT' : 'ETABLISSEMENT.FORM.TITLE_ADD')}</h1>
        <Link href="/etablissements" className="btn btn-outline">
          <Icon name="arrow_back" /> {t('COMMON.BACK')}
        </Link>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && (
        <form onSubmit={onSubmit}>

          {/* Section 1: Identification */}
          <div className="siipe-card mb-2">
            <h3 className="section-title">{t('ETABLISSEMENT.DETAIL.SECTION_IDENTIFICATION')}</h3>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.NOM_FR_LABEL')}</label>
                <input
                  type="text"
                  value={form.nomFr}
                  placeholder={t('ETABLISSEMENT.FORM.NOM_FR_PLACEHOLDER')}
                  onChange={e => updateField('nomFr', e.target.value)}
                  onBlur={() => markTouched('nomFr')}
                />
                {nomFrInvalid && touched.nomFr && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.NOM_AR_LABEL')}</label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="الاسم بالعربية"
                  value={form.nomAr}
                  onChange={e => updateField('nomAr', e.target.value)}
                  onBlur={() => markTouched('nomAr')}
                />
                {nomArInvalid && touched.nomAr && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.CODE')}</label>
                <input
                  type="text"
                  value={form.code}
                  placeholder={t('ETABLISSEMENT.CODE')}
                  onChange={e => updateField('code', e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.TELEPHONE')}</label>
                <input type="text" value={form.telephone} placeholder="0600000000" onChange={e => updateField('telephone', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FAX')}</label>
                <input type="text" value={form.fax} placeholder={t('ETABLISSEMENT.FAX')} onChange={e => updateField('fax', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.ADRESSE')}</label>
                <input type="text" value={form.adresse} placeholder={t('ETABLISSEMENT.ADRESSE')} onChange={e => updateField('adresse', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.PERSONNE_RESPONSABLE')}</label>
                <select value={form.personneResponsableCentre} onChange={e => updateField('personneResponsableCentre', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  {personnel.map(p => (
                    <option key={p.id} value={`${p.nom} ${p.prenom}`}>{p.nom} {p.prenom}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.MILIEU')}</label>
                <select value={form.milieu} onChange={e => updateField('milieu', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="URBAIN">{t('ETABLISSEMENT.MILIEUX.URBAIN')}</option>
                  <option value="RURAL">{t('ETABLISSEMENT.MILIEUX.RURAL')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.TYPE_LOCAL')}</label>
                <select value={form.typeLocal} onChange={e => updateField('typeLocal', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="CENTRE_SOCIALE">{t('ETABLISSEMENT.TYPES.CENTRE_SOCIALE')}</option>
                  <option value="DELEGATION">{t('ETABLISSEMENT.TYPES.DELEGATION')}</option>
                  <option value="COORDINATION">{t('ETABLISSEMENT.TYPES.COORDINATION')}</option>
                  <option value="DEPOT">{t('ETABLISSEMENT.TYPES.DEPOT')}</option>
                  <option value="AUTRE">{t('ETABLISSEMENT.TYPES.AUTRE')}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.UTILISATION')}</label>
                <select value={form.utilisation} onChange={e => updateField('utilisation', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="utilisé">{t('ETABLISSEMENT.FORM.UTILISATION_UTILISE')}</option>
                  <option value="non utilisé">{t('ETABLISSEMENT.FORM.UTILISATION_NON_UTILISE')}</option>
                  <option value="partiellement utilisé">{t('ETABLISSEMENT.FORM.UTILISATION_PARTIEL')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.LOYER')}</label>
                <select value={form.loyer} onChange={e => updateField('loyer', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
              {showLoyerFields && (
                <div className="field">
                  <label>{t('ETABLISSEMENT.FORM.QUI_PAIE_LOYER')}</label>
                  <input type="text" value={form.paieLoyer} placeholder={t('ETABLISSEMENT.FORM.QUI_PAIE_LOYER')} onChange={e => updateField('paieLoyer', e.target.value)} />
                </div>
              )}
            </div>
            {showLoyerFields && (
              <div className="form-row">
                <div className="field">
                  <label>{t('ETABLISSEMENT.FORM.MONTANT_LOYER_LABEL')}</label>
                  <input type="number" value={form.montantLoyer} placeholder="0" onChange={e => updateField('montantLoyer', e.target.value)} />
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.ETAT_CONSTRUCTION_LABEL')}</label>
                <select value={form.etatConstruction} onChange={e => updateField('etatConstruction', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="Bon">{t('ETABLISSEMENT.FORM.ETAT_BON')}</option>
                  <option value="Moyen">{t('ETABLISSEMENT.FORM.ETAT_MOYEN')}</option>
                  <option value="Mauvais">{t('ETABLISSEMENT.FORM.ETAT_MAUVAIS')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Localisation */}
          <div className="siipe-card mb-2">
            <h3 className="section-title">{t('ETABLISSEMENT.DETAIL.SECTION_LOCALISATION')}</h3>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.REGION')}</label>
                <select value={form.regionId} onChange={e => onRegionChange(e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.nomFr}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.PROVINCE')} *</label>
                <select value={form.provinceId} onChange={e => updateField('provinceId', e.target.value)} onBlur={() => markTouched('provinceId')}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  {filteredProvinces.map(p => (
                    <option key={p.id} value={p.id}>{p.nomFr}</option>
                  ))}
                </select>
                {provinceInvalid && touched.provinceId && <span className="err">{t('ETABLISSEMENT.FORM.REQUIRED')}</span>}
              </div>
            </div>
            <div className="coords-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.LAT_LABEL')}</label>
                <input
                  type="number"
                  value={form.latitude}
                  placeholder="ex: 33.589"
                  onChange={e => updateField('latitude', e.target.value)}
                  onBlur={updateMarker}
                />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.LNG_LABEL')}</label>
                <input
                  type="number"
                  value={form.longitude}
                  placeholder="ex: -7.603"
                  onChange={e => updateField('longitude', e.target.value)}
                  onBlur={updateMarker}
                />
              </div>
              <button type="button" className="btn btn-outline" onClick={locateMe}>
                <Icon name="my_location" /> {t('ETABLISSEMENT.FORM.MY_LOCATION')}
              </button>
            </div>
            <div className="map-hint">
              <Icon name="info_outline" />
              {t('ETABLISSEMENT.FORM.MAP_HINT')}
            </div>
            <div ref={mapContainerRef} className="map-container" />
          </div>

          {/* Section 3: Données techniques */}
          <div className="siipe-card mb-2">
            <h3 className="section-title">{t('ETABLISSEMENT.DETAIL.TAB_TECH')}</h3>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.PROPRIETE_LABEL')}</label>
                <select value={form.proprietecentre} onChange={e => updateField('proprietecentre', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="ENTRAIDE">{t('ETABLISSEMENT.FORM.PROPRIETE_ENTRAIDE')}</option>
                  <option value="COMMUNE">{t('ETABLISSEMENT.FORM.PROPRIETE_COMMUNE')}</option>
                  <option value="DOMAINE">{t('ETABLISSEMENT.FORM.PROPRIETE_DOMAINE')}</option>
                  <option value="ASSOCIATION">{t('ETABLISSEMENT.FORM.PROPRIETE_ASSOCIATION')}</option>
                  <option value="AUTRE">{t('ETABLISSEMENT.FORM.PROPRIETE_AUTRE')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.NUMERO_TITRE')}</label>
                <input type="text" value={form.numerotitre} placeholder={t('ETABLISSEMENT.DETAIL.NUMERO_TITRE')} onChange={e => updateField('numerotitre', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.DATE_ACHAT')}</label>
                <input type="date" value={form.dateAchat} onChange={e => updateField('dateAchat', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.DATE_EXPLOITATION')}</label>
                <input type="date" value={form.dateExploitation} onChange={e => updateField('dateExploitation', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.DATE_CONSTRUCTION')}</label>
                <input type="date" value={form.dateConstruction} onChange={e => updateField('dateConstruction', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.SUPERFICIE_TERRAIN')} (m²)</label>
                <input type="number" value={form.superficieTerrain} placeholder="0" onChange={e => updateField('superficieTerrain', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.SURFACE_BATIE')} (m²)</label>
                <input type="number" value={form.surfaceBatie} placeholder="0" onChange={e => updateField('surfaceBatie', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.SUPERFICIE_ETAGES')} (m²)</label>
                <input type="number" value={form.superficieTotaleEtages} placeholder="0" onChange={e => updateField('superficieTotaleEtages', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.NOMBRE_ETAGES')}</label>
                <select value={form.nombreEtage} onChange={e => updateField('nombreEtage', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="0">{t('ETABLISSEMENT.FORM.ETAGE_SOUS_SOL')}</option>
                  <option value="1">{t('ETABLISSEMENT.FORM.ETAGE_1')}</option>
                  <option value="2">{t('ETABLISSEMENT.FORM.ETAGE_2')}</option>
                  <option value="3">{t('ETABLISSEMENT.FORM.ETAGE_3')}</option>
                  <option value="4">{t('ETABLISSEMENT.FORM.ETAGE_4')}</option>
                  <option value="5">{t('ETABLISSEMENT.FORM.ETAGE_5')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.COMPOSANT_LABEL')}</label>
                <input type="text" value={form.composant} placeholder={t('ETABLISSEMENT.FORM.COMPOSANT_LABEL')} onChange={e => updateField('composant', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.ETAGES_UTILISES_LABEL')}</label>
                <input type="text" value={form.etagesUtilises} placeholder={t('ETABLISSEMENT.FORM.ETAGES_UTILISES_PLACEHOLDER')} onChange={e => updateField('etagesUtilises', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field" style={{ gridColumn: 'span 3' }}>
                <label>{t('ETABLISSEMENT.FORM.OBSERVATION_LABEL')}</label>
                <textarea value={form.observation} rows={3} style={{ width: '100%', resize: 'vertical' }} onChange={e => updateField('observation', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.EAU_POTABLE')}</label>
                <select value={form.raccordementEauPotable} onChange={e => updateField('raccordementEauPotable', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.ELECTRICITE')}</label>
                <select value={form.raccordementElectricite} onChange={e => updateField('raccordementElectricite', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.PLAN_SITUATION_LABEL')}</label>
                <select value={form.planSituation} onChange={e => updateField('planSituation', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.PLAN_ARCHITECTURE_LABEL')}</label>
                <select value={form.planArchitecture} onChange={e => updateField('planArchitecture', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.LITIGE_LABEL')}</label>
                <select value={form.litige} onChange={e => updateField('litige', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
            </div>
            {showLitigeField && (
              <div className="form-row">
                <div className="field">
                  <label>{t('ETABLISSEMENT.FORM.RAISONS_CONFLIT_LABEL')}</label>
                  <input type="text" value={form.raisonsConflit} placeholder={t('ETABLISSEMENT.FORM.RAISONS_CONFLIT_LABEL')} onChange={e => updateField('raisonsConflit', e.target.value)} />
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.FORM.PRIX_BATIMENT_LABEL')}</label>
                <input type="number" value={form.prixBatiment} placeholder="0" onChange={e => updateField('prixBatiment', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.CAPACITE')}</label>
                <input type="number" value={form.capaciteAccueil} placeholder="0" onChange={e => updateField('capaciteAccueil', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.GERE_PAR')}</label>
                <select value={form.gererPar} onChange={e => updateField('gererPar', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="EN">{t('ETABLISSEMENT.FORM.GERER_PAR_EN')}</option>
                  <option value="ASSOCIATION">{t('ETABLISSEMENT.FORM.GERER_PAR_ASSOCIATION')}</option>
                  <option value="AUTRE">{t('ETABLISSEMENT.FORM.GERER_PAR_AUTRE')}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.AUTORISE')}</label>
                <select value={form.autorise} onChange={e => updateField('autorise', e.target.value)}>
                  <option value="">{t('ETABLISSEMENT.FORM.SELECT_PLACEHOLDER')}</option>
                  <option value="true">{t('COMMON.YES')}</option>
                  <option value="false">{t('COMMON.NO')}</option>
                </select>
              </div>
              {showAutoriseField && (
                <div className="field">
                  <label>{t('ETABLISSEMENT.DETAIL.NUMERO_AUTORISATION')}</label>
                  <input type="text" value={form.numeroAutorisation} placeholder={t('ETABLISSEMENT.DETAIL.NUMERO_AUTORISATION')} onChange={e => updateField('numeroAutorisation', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Documents */}
          <div className="siipe-card mb-2">
            <h3 className="section-title">{t('ETABLISSEMENT.DETAIL.TAB_DOCS')}</h3>
            <div className="form-row">
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.DOC_MAPPE_CADASTRALE')}</label>
                <input type="file" style={{ padding: 6 }} onChange={e => onFileChange(e, 'mappeCadastrale')} />
                {existingFiles.mappeCadastrale && (
                  <a href={getFileUrl(existingFiles.mappeCadastrale)} target="_blank" rel="noopener noreferrer" className="file-link">
                    {t('ETABLISSEMENT.FORM.VIEW_CURRENT_FILE')}
                  </a>
                )}
              </div>
              <div className="field">
                <label>{t('ETABLISSEMENT.DETAIL.DOC_CERTIFICAT_PROPRIETE')}</label>
                <input type="file" style={{ padding: 6 }} onChange={e => onFileChange(e, 'certificatPropriete')} />
                {existingFiles.certificatPropriete && (
                  <a href={getFileUrl(existingFiles.certificatPropriete)} target="_blank" rel="noopener noreferrer" className="file-link">
                    {t('ETABLISSEMENT.FORM.VIEW_CURRENT_FILE')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Programmes & Prestations */}
          <div className="siipe-card mb-2">
            <h3 className="section-title">{t('ETABLISSEMENT.FORM.SECTION_PROGRAMMES')}</h3>
            <div className="form-row">
              <div className="field">
                <label>{t('MENU.PROGRAMMES')}</label>
                <div className="programmes-list">
                  {programmes.map(p => (
                    <label key={p.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isProgrammeSelected(p.id)}
                        onChange={() => toggleProgramme(p.id, p)}
                        style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                      />
                      {p.nomFr}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {selectedProgrammes.map(prog => (
              <div key={prog.id} className="programme-prestations">
                <div className="prog-label">
                  <Icon name="category" />
                  {prog.nomFr} — {t('ETABLISSEMENT.FORM.PRESTATIONS_SUFFIX')}
                </div>
                <div className="prestations-grid">
                  {getPrestationsForProgramme(prog.id).map(pr => (
                    <label key={pr.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isPrestationSelected(pr.id)}
                        onChange={() => togglePrestation(pr.id)}
                        style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                      />
                      {pr.nomFr}
                    </label>
                  ))}
                  {getPrestationsForProgramme(prog.id).length === 0 && (
                    <span className="text-secondary" style={{ fontSize: 13 }}>{t('ETABLISSEMENT.FORM.NO_PRESTATIONS')}</span>
                  )}
                </div>
              </div>
            ))}

            {prestationSectionHint && (
              <div className="text-secondary" style={{ fontSize: 13, marginTop: 8 }}>
                {t('ETABLISSEMENT.FORM.SELECT_PROGRAMME_HINT')}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Link href="/etablissements" className="btn btn-outline">{t('COMMON.CANCEL')}</Link>
            <button type="submit" className="btn btn-primary" disabled={formInvalid || saving}>
              {saving ? <span className="spinner small" /> : <span>{t(isEdit ? 'COMMON.SAVE' : 'ETABLISSEMENT.FORM.CREATE')}</span>}
            </button>
          </div>

        </form>
      )}

      <style jsx>{`
        .section-title {
          color: var(--color-primary-dark);
          font-size: 16px;
          font-weight: 600;
          border-bottom: 2px solid var(--color-primary-surface);
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .programmes-list {
          display: flex; flex-wrap: wrap; gap: 10px;
          padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
          min-height: 60px;
        }
        .err { color: var(--color-danger); font-size: 12px; }
        .form-actions {
          display: flex; justify-content: flex-end;
          gap: 12px; margin-top: 16px; margin-bottom: 32px;
        }
        .coords-row {
          display: grid; grid-template-columns: 1fr 1fr auto;
          gap: 16px; align-items: end; margin-bottom: 12px;
        }
        .map-hint {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 8px;
        }
        .map-hint :global(.material-icons) { font-size: 16px; width: 16px; height: 16px; }
        .map-container {
          height: 380px; border-radius: var(--radius-md);
          border: 1px solid var(--color-border); z-index: 1;
        }
        .file-link { color: var(--color-primary); font-size: 12px; text-decoration: none; }
        .file-link:hover { text-decoration: underline; }
        .programme-prestations {
          margin-top: 16px; border: 1px solid var(--color-border);
          border-radius: var(--radius-md); overflow: hidden;
        }
        .prog-label {
          display: flex; align-items: center; gap: 8px;
          background: var(--color-primary-surface); color: var(--color-primary);
          padding: 8px 14px; font-weight: 600; font-size: 14px;
        }
        .prog-label :global(.material-icons) { font-size: 18px; width: 18px; height: 18px; }
        .prestations-grid {
          display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 14px;
        }
        .checkbox-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; color: var(--color-text); cursor: pointer;
        }
        .spinner.small {
          width: 18px; height: 18px; border-width: 2px;
          border-color: rgba(255,255,255,0.4); border-top-color: white;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
