'use client';

import { useParams } from 'next/navigation';
import { PersonnelForm } from '@/components/features/PersonnelForm';

export default function PersonnelEditPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <PersonnelForm id={id} />;
}
