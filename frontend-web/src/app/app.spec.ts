import { describe, expect, it, vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('propose l installation puis ferme la banniere apres le choix utilisateur', async () => {
    const app = new App();
    const event = new Event('beforeinstallprompt', { cancelable: true });
    app.onbeforeinstallprompt(event);
    expect(event.defaultPrevented).toBe(true);
    expect(app.showInstallBanner).toBe(true);

    const prompt = vi.fn();
    app.deferredPrompt = { prompt, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
    app.installerPWA();
    expect(prompt).toHaveBeenCalledOnce();
    expect(app.showInstallBanner).toBe(false);
    await Promise.resolve();
    expect(app.deferredPrompt).toBeNull();
  });
});
