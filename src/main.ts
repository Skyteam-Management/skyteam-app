import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DEFAULT_DIALOG_CONFIG, DialogConfig } from '@angular/cdk/dialog';

import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES),
    provideAnimations(),
    {
      provide: DEFAULT_DIALOG_CONFIG,
      // Merge onto a fresh DialogConfig so we keep CDK defaults
      // (hasBackdrop: true, closeOnNavigation, autoFocus, etc.) — CDK does
      // `{...defaults, ...userConfig}`, so a plain object would null those out.
      useFactory: (): DialogConfig => Object.assign(new DialogConfig(), {
        width: '100%',
        maxWidth: 'min(32rem, calc(100vw - 2rem))',
        maxHeight: 'calc(100dvh - 2rem)',
        backdropClass: 'app-dialog-backdrop',
      }),
    },
  ],
}).catch((err) => console.error(err));
