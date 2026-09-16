import { Pipe, PipeTransform } from '@angular/core';
import { ROLE_LABELS, Role } from '../../core/models/user.model';

@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    if (!role) return '';
    return ROLE_LABELS[role as Role] || role;
  }
}
