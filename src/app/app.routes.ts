import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['ROLE_ADMIN'])],
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
      },

      // --- Etablissements ---
      {
        path: 'etablissements',
        loadComponent: () => import('./features/etablissements/list/etablissements-list.component').then(m => m.EtablissementsListComponent)
      },
      {
        path: 'etablissements/add',
        loadComponent: () => import('./features/etablissements/form/etablissement-form.component').then(m => m.EtablissementFormComponent)
      },
      {
        path: 'etablissements/map',
        loadComponent: () => import('./features/etablissements/map/etablissements-map.component').then(m => m.EtablissementsMapComponent)
      },
      {
        path: 'etablissements/:id/edit',
        loadComponent: () => import('./features/etablissements/form/etablissement-form.component').then(m => m.EtablissementFormComponent)
      },
      {
        path: 'etablissements/:id',
        loadComponent: () => import('./features/etablissements/detail/etablissement-detail.component').then(m => m.EtablissementDetailComponent)
      },

      // --- Programmes ---
      {
        path: 'programmes',
        loadComponent: () => import('./features/programmes/programmes.component').then(m => m.ProgrammesComponent)
      },

      // --- Partenaires ---
      {
        path: 'partenaires',
        loadComponent: () => import('./features/partenaires/list/partenaires-list.component').then(m => m.PartenairesListComponent)
      },

      // --- Subventions ---
      {
        path: 'subventions',
        loadComponent: () => import('./features/subventions/list/subventions-list.component').then(m => m.SubventionsListComponent)
      },

      // --- Personnel ---
      {
        path: 'personnel',
        loadComponent: () => import('./features/personnel/list/personnel-list.component').then(m => m.PersonnelListComponent)
      },
      {
        path: 'personnel/add',
        loadComponent: () => import('./features/personnel/form/personnel-form.component').then(m => m.PersonnelFormComponent)
      },
      {
        path: 'personnel/:id/edit',
        loadComponent: () => import('./features/personnel/form/personnel-form.component').then(m => m.PersonnelFormComponent)
      },
      {
        path: 'personnel/:id/evaluation',
        loadComponent: () => import('./features/personnel/evaluation/personnel-evaluation.component').then(m => m.PersonnelEvaluationComponent)
      },
      {
        path: 'personnel/:id',
        loadComponent: () => import('./features/personnel/detail/personnel-detail.component').then(m => m.PersonnelDetailComponent)
      },

      // --- Formations ---
      {
        path: 'formations',
        loadComponent: () => import('./features/formations/list/formations-list.component').then(m => m.FormationsListComponent)
      },

      // --- Beneficiaires ---
      {
        path: 'beneficiaires',
        loadComponent: () => import('./features/beneficiaires/search/beneficiaires-search.component').then(m => m.BeneficiairesSearchComponent)
      },
      {
        path: 'beneficiaires/add',
        loadComponent: () => import('./features/beneficiaires/form/beneficiaire-form.component').then(m => m.BeneficiaireFormComponent)
      },
      {
        path: 'beneficiaires/:id/edit',
        loadComponent: () => import('./features/beneficiaires/form/beneficiaire-form.component').then(m => m.BeneficiaireFormComponent)
      },
      {
        path: 'beneficiaires/:id',
        loadComponent: () => import('./features/beneficiaires/detail/beneficiaire-detail.component').then(m => m.BeneficiaireDetailComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
