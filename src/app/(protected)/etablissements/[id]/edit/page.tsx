'use client';

import { useParams } from 'next/navigation';
import EtablissementForm from '@/components/features/EtablissementForm';

export default function EditEtablissementPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <EtablissementForm id={id} />;
}
