import { getContentModelImage } from '../../lib/imageEdit/utils/getContentModelImage';
import { ImageEditPlugin } from '../../lib/imageEdit/ImageEditPlugin';
import { initEditor } from '../TestHelper';
//import * as formatInsertPointWithContentModel from 'roosterjs-content-model-api/lib/publicApi/utils/formatInsertPointWithContentModel';
import {
    ContentModelDocument,
    ImageSelection,
    SelectionChangedEvent,
} from 'roosterjs-content-model-types';

const model: ContentModelDocument = {
    blockGroupType: 'Document',
    blocks: [
        {
            blockType: 'Paragraph',
            segments: [
                {
                    segmentType: 'Image',
                    src: 'test',
                    format: {
                        fontFamily: 'Calibri',
                        fontSize: '11pt',
                        textColor: 'rgb(0, 0, 0)',
                        id: 'image_0',
                        maxWidth: '1800px',
                    },
                    dataset: {},
                    isSelectedAsImageSelection: true,
                    isSelected: true,
                },
            ],
            format: {},
            segmentFormat: {
                fontFamily: 'Calibri',
                fontSize: '11pt',
                textColor: 'rgb(0, 0, 0)',
            },
        },
    ],
    format: {
        fontFamily: 'Calibri',
        fontSize: '11pt',
        textColor: '#000000',
    },
};

describe('ImageEditPlugin', () => {
    const plugin = new ImageEditPlugin();
    const editor = initEditor('image_edit', [plugin], model);

    it('flip', () => {
        plugin.initialize(editor);
        const selection = editor.getDOMSelection() as ImageSelection;
        const image = selection.image;
        plugin.flipImage(editor, image, 'horizontal');
        const imageModel = getContentModelImage(editor);
        expect(imageModel!.dataset['editingInfo']).toBeTruthy();
        plugin.onPluginEvent({
            eventType: 'selectionChanged',
            newSelection: null,
        });
        plugin.dispose();
    });

    it('rotate', () => {
        plugin.initialize(editor);
        const selection = editor.getDOMSelection() as ImageSelection;
        plugin.rotateImage(editor, selection.image, Math.PI / 2);
        const imageModel = getContentModelImage(editor);
        expect(imageModel!.dataset['editingInfo']).toBeTruthy();
        plugin.onPluginEvent({
            eventType: 'selectionChanged',
            newSelection: null,
        });
        plugin.dispose();
    });
});
