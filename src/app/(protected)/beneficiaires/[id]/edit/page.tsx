'use client';

import { useParams } from 'next/navigation';
import { BeneficiaireForm } from '@/components/features/BeneficiaireForm';

export default function EditBeneficiairePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <BeneficiaireForm id={id} />;
}
