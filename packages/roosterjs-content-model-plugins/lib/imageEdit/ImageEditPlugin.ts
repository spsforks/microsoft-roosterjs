import DragAndDropContext from './types/DragAndDropContext';
import ImageHtmlOptions from './types/ImageHtmlOptions';
import { applyChange } from './utils/applyChange';
import { checkIfImageWasResized } from './utils/imageEditUtils';
import { createImageWrapper } from './utils/createImageWrapper';
import { Cropper } from './Cropper/cropperContext';
import { DragAndDropHelper } from '../pluginUtils/DragAndDrop/DragAndDropHelper';
import { getDropAndDragHelpers } from './utils/getDropAndDragHelpers';
import { getHTMLImageOptions } from './utils/getHTMLImageOptions';
import { getImageEditInfo } from './utils/getImageEditInfo';
import { ImageEditElementClass } from './types/ImageEditElementClass';
import { ImageEditOptions } from './types/ImageEditOptions';
import { RESIZE_IMAGE } from './constants/constants';
import { Resizer } from './Resizer/resizerContext';
import { Rotator } from './Rotator/rotatorContext';
import { updateWrapper } from './utils/updateWrapper';

import type {
    EditorPlugin,
    IEditor,
    ImageMetadataFormat,
    PluginEvent,
    SelectionChangedEvent,
} from 'roosterjs-content-model-types';

const DefaultOptions: Partial<ImageEditOptions> = {
    borderColor: '#DB626C',
    minWidth: 10,
    minHeight: 10,
    preserveRatio: true,
    disableRotate: false,
    disableSideResize: false,
    onSelectState: 'resizeAndRotate',
};

/**
 * ImageEdit plugin handles the following image editing features:
 * - Resize image
 * - Crop image
 * - Rotate image
 * - Flip image
 */
export class ImageEditPlugin implements EditorPlugin {
    private editor: IEditor | null = null;
    private shadowSpan: HTMLSpanElement | null = null;
    private selectedImage: HTMLImageElement | null = null;
    private wrapper: HTMLSpanElement | null = null;
    private imageEditInfo: ImageMetadataFormat | null = null;
    private imageHTMLOptions: ImageHtmlOptions | null = null;
    private dndHelpers: DragAndDropHelper<DragAndDropContext, any>[] = [];
    private clonedImage: HTMLImageElement | null = null;
    private lastSrc: string | null = null;
    private wasImageResized: boolean = false;
    private isCropMode: boolean = false;

    constructor(private options: ImageEditOptions = DefaultOptions) {}

    /**
     * Get name of this plugin
     */
    getName() {
        return 'ImageEdit';
    }

    /**
     * The first method that editor will call to a plugin when editor is initializing.
     * It will pass in the editor instance, plugin should take this chance to save the
     * editor reference so that it can call to any editor method or format API later.
     * @param editor The editor object
     */
    initialize(editor: IEditor) {
        this.editor = editor;
    }

    /**
     * The last method that editor will call to a plugin before it is disposed.
     * Plugin can take this chance to clear the reference to editor. After this method is
     * called, plugin should not call to any editor method since it will result in error.
     */
    dispose() {
        this.editor = null;

        this.cleanInfo();
    }

    /**
     * Core method for a plugin. Once an event happens in editor, editor will call this
     * method of each plugin to handle the event as long as the event is not handled
     * exclusively by another plugin.
     * @param event The event to handle:
     */
    onPluginEvent(event: PluginEvent) {
        if (this.editor) {
            switch (event.eventType) {
                case 'selectionChanged':
                    this.handleSelectionChangedEvent(this.editor, event);
                    break;
                case 'mouseDown':
                    if (
                        this.selectedImage &&
                        this.imageEditInfo &&
                        this.shadowSpan !== event.rawEvent.target
                    ) {
                        this.removeImageWrapper(this.editor, this.dndHelpers);
                    }
                    break;
                case 'contentChanged':
                    if (
                        event.source != RESIZE_IMAGE &&
                        this.selectedImage &&
                        this.imageEditInfo &&
                        this.shadowSpan
                    ) {
                        this.removeImageWrapper(this.editor, this.dndHelpers);
                    }
                    break;
                case 'keyDown':
                    if (this.selectedImage && this.imageEditInfo && this.shadowSpan) {
                        this.removeImageWrapper(this.editor, this.dndHelpers);
                    }
                    break;
                case 'editImage':
                    if (event.image === this.selectedImage) {
                        if (event.startCropping) {
                            this.startCropping(this.editor, event.image);
                        }
                    }
                    break;
            }
        }
    }

    private handleSelectionChangedEvent(editor: IEditor, event: SelectionChangedEvent) {
        if (event.newSelection?.type == 'image' && !this.selectedImage) {
            this.startEditing(editor, event.newSelection.image);
        }
    }

    private startEditing(editor: IEditor, image: HTMLImageElement) {
        this.imageEditInfo = getImageEditInfo(image);
        this.lastSrc = image.getAttribute('src');
        this.imageHTMLOptions = getHTMLImageOptions(editor, this.options, this.imageEditInfo);
        const { resizers, rotators, wrapper, shadowSpan, imageClone } = createImageWrapper(
            editor,
            image,
            this.options,
            this.imageEditInfo,
            this.imageHTMLOptions,
            undefined /* operation */
        );
        this.shadowSpan = shadowSpan;
        this.selectedImage = image;
        this.wrapper = wrapper;
        this.clonedImage = imageClone;
        this.wasImageResized = checkIfImageWasResized(image);
        const zoomScale = editor.getDOMHelper().calculateZoomScale();
        this.dndHelpers = [
            ...getDropAndDragHelpers(
                wrapper,
                this.imageEditInfo,
                this.options,
                ImageEditElementClass.ResizeHandle,
                Resizer,
                () => {
                    if (this.imageEditInfo && this.selectedImage && this.wrapper) {
                        updateWrapper(
                            editor,
                            this.imageEditInfo,
                            this.options,
                            this.selectedImage,
                            imageClone,
                            this.wrapper,
                            rotators,
                            resizers,
                            undefined
                        );
                        this.wasImageResized = true;
                    }
                },
                zoomScale
            ),
            ...getDropAndDragHelpers(
                wrapper,
                this.imageEditInfo,
                this.options,
                ImageEditElementClass.RotateHandle,
                Rotator,
                () => {
                    if (this.imageEditInfo && this.selectedImage && this.wrapper) {
                        updateWrapper(
                            editor,
                            this.imageEditInfo,
                            this.options,
                            this.selectedImage,
                            imageClone,
                            this.wrapper,
                            rotators,
                            resizers,
                            undefined
                        );
                    }
                },
                zoomScale
            ),
        ];

        updateWrapper(
            editor,
            this.imageEditInfo,
            this.options,
            this.selectedImage,
            imageClone,
            this.wrapper,
            rotators,
            resizers,
            undefined
        );

        editor.setDOMSelection({
            type: 'image',
            image: image,
        });
    }

    private startCropping(editor: IEditor, image: HTMLImageElement) {
        if (this.wrapper && this.selectedImage && this.shadowSpan) {
            this.removeImageWrapper(editor, this.dndHelpers);
        }
        this.lastSrc = image.getAttribute('src');
        this.imageEditInfo = getImageEditInfo(image);
        this.imageHTMLOptions = getHTMLImageOptions(editor, this.options, this.imageEditInfo);
        const zoomScale = editor.getDOMHelper().calculateZoomScale();
        const { wrapper, shadowSpan, imageClone, croppers } = createImageWrapper(
            editor,
            image,
            this.options,
            this.imageEditInfo,
            this.imageHTMLOptions,
            'crop'
        );
        this.shadowSpan = shadowSpan;
        this.selectedImage = image;
        this.wrapper = wrapper;
        this.clonedImage = imageClone;
        this.dndHelpers = [
            ...getDropAndDragHelpers(
                wrapper,
                this.imageEditInfo,
                this.options,
                ImageEditElementClass.CropHandle,
                Cropper,
                () => {
                    if (this.imageEditInfo && this.selectedImage && this.wrapper) {
                        updateWrapper(
                            editor,
                            this.imageEditInfo,
                            this.options,
                            this.selectedImage,
                            imageClone,
                            this.wrapper,
                            undefined,
                            undefined,
                            croppers
                        );
                        this.isCropMode = true;
                    }
                },
                zoomScale
            ),
        ];

        editor.setDOMSelection({
            type: 'image',
            image: image,
        });
    }

    private cleanInfo() {
        this.selectedImage = null;
        this.shadowSpan = null;
        this.wrapper = null;
        this.imageEditInfo = null;
        this.imageHTMLOptions = null;
        this.dndHelpers.forEach(helper => helper.dispose());
        this.dndHelpers = [];
        this.clonedImage = null;
        this.lastSrc = null;
        this.wasImageResized = false;
        this.isCropMode = false;
    }

    private removeImageWrapper(
        editor: IEditor,
        resizeHelpers: DragAndDropHelper<DragAndDropContext, any>[]
    ) {
        if (this.lastSrc && this.selectedImage && this.imageEditInfo && this.clonedImage) {
            applyChange(
                editor,
                this.selectedImage,
                this.imageEditInfo,
                this.lastSrc,
                this.wasImageResized || this.isCropMode,
                this.clonedImage
            );
        }
        const helper = editor.getDOMHelper();
        if (this.shadowSpan && this.shadowSpan.parentElement) {
            helper.unwrap(this.shadowSpan);
        }
        resizeHelpers.forEach(helper => helper.dispose());
        this.cleanInfo();
    }
}
