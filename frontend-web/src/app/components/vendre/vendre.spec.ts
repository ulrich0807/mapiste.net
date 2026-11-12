import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Vendre } from './vendre';

describe('Edition des photos et equipements', () => {
  function setup() {
    const service = { updateAnnonce: vi.fn(() => of({ success: true })) };
    const component = new Vendre(service as any, {} as any);
    component.modeEdition = true;
    component.idEdition = 7;
    component.annonceData = {
      titre: 'Studio', prix: '100000', commune: 'Cocody',
      type_contrat: 'location', description: 'Description',
    };
    return { component, service };
  }

  it('retire une ancienne photo sans supprimer le nouveau fichier', () => {
    const { component } = setup();
    const cat = component.categoriesPhotos[0];
    const file = new File(['photo'], 'new.jpg', { type: 'image/jpeg' });
    cat.existingImages = ['old.jpg'];
    cat.files = [file];
    cat.previews = ['old.jpg', 'blob:new'];

    component.retirerPhoto(cat.code, 0);

    expect(cat.existingImages).toEqual([]);
    expect(cat.files).toEqual([file]);
    expect(cat.previews).toEqual(['blob:new']);
  });

  it('retire le bon nouveau fichier lorsque des anciennes photos existent', () => {
    const { component } = setup();
    const cat = component.categoriesPhotos[0];
    const first = new File(['a'], 'first.jpg');
    const second = new File(['b'], 'second.jpg');
    cat.existingImages = ['old.jpg'];
    cat.files = [first, second];
    cat.previews = ['old.jpg', 'blob:first', 'blob:second'];
    const revoke = vi.fn();
    vi.stubGlobal('URL', { revokeObjectURL: revoke });
    try {
      component.retirerPhoto(cat.code, 2);
      expect(cat.files).toEqual([first]);
      expect(cat.existingImages).toEqual(['old.jpg']);
      expect(revoke).toHaveBeenCalledWith('blob:second');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('envoie les equipements vides et les seules anciennes photos conservees', () => {
    const { component, service } = setup();
    component.categoriesPhotos[0].existingImages = ['old.jpg'];
    component.soumettreAnnonce({ preventDefault() {} } as Event);

    const data = (service.updateAnnonce.mock.calls[0] as unknown as [number, FormData])[1];
    expect(data.get('equipements')).toBe('[]');
    expect(JSON.parse(String(data.get('retained_images'))).salon).toEqual(['old.jpg']);
  });
});
