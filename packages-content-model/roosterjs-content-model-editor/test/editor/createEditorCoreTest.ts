import * as darkColorHandler from '../../lib/editor/DarkColorHandlerImpl';
import { coreApiMap } from '../../lib/coreApi/coreApiMap';
import { createEditorCore } from '../../lib/editor/createEditorCore';

describe('createEditorCore', () => {
    const mockedSizeTransformer = 'TRANSFORMER' as any;
    const mockedEditPluginState = 'EDITSTATE' as any;
    const mockedContextMenuPluginState = 'CONTEXTMENUSTATE' as any;
    const mockedInnerHandler = 'INNER' as any;
    const mockedDarkHandler = 'DARK' as any;

    beforeEach(() => {
        spyOn(darkColorHandler, 'createDarkColorHandler').and.returnValue(mockedDarkHandler);
    });

    it('No additional option', () => {
        const core = createEditorCore(
            {},
            {
                edit: mockedEditPluginState,
                contextMenu: mockedContextMenuPluginState,
            },
            mockedInnerHandler,
            mockedSizeTransformer
        );

        expect(core).toEqual({
            api: { ...coreApiMap },
            originalApi: { ...coreApiMap },
            customData: {},
            experimentalFeatures: [],
            edit: mockedEditPluginState,
            contextMenu: mockedContextMenuPluginState,
            sizeTransformer: mockedSizeTransformer,
            darkColorHandler: mockedDarkHandler,
        });
        expect(darkColorHandler.createDarkColorHandler).toHaveBeenCalledWith(mockedInnerHandler);
    });

    it('With additional plugins', () => {
        const mockedPlugin1 = 'P1' as any;
        const mockedPlugin2 = 'P2' as any;
        const mockedFeatures = 'FEATURES' as any;
        const mockedCoreApi = {
            a: 'b',
        } as any;

        const core = createEditorCore(
            {
                plugins: [mockedPlugin1, mockedPlugin2],
                experimentalFeatures: mockedFeatures,
                legacyCoreApiOverride: mockedCoreApi,
            },
            {
                edit: mockedEditPluginState,
                contextMenu: mockedContextMenuPluginState,
            },
            mockedInnerHandler,
            mockedSizeTransformer
        );

        expect(core).toEqual({
            api: { ...coreApiMap, a: 'b' } as any,
            originalApi: { ...coreApiMap },
            customData: {},
            experimentalFeatures: mockedFeatures,
            edit: mockedEditPluginState,
            contextMenu: mockedContextMenuPluginState,
            sizeTransformer: mockedSizeTransformer,
            darkColorHandler: mockedDarkHandler,
        });
        expect(darkColorHandler.createDarkColorHandler).toHaveBeenCalledWith(mockedInnerHandler);
    });
});
