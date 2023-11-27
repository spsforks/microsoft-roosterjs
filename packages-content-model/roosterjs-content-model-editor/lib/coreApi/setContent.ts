import {
    ChangeSource,
    ColorTransformDirection,
    PluginEventType,
    SelectionRangeTypes,
} from 'roosterjs-editor-types';
import {
    createRange,
    extractContentMetadata,
    queryElements,
    restoreContentWithEntityPlaceholder,
} from 'roosterjs-editor-dom';
import type { ContentMetadata } from 'roosterjs-editor-types';
import type { DOMSelection, SetContent, StandaloneEditorCore } from 'roosterjs-content-model-types';

/**
 * @internal
 * Set HTML content to this editor. All existing content will be replaced. A ContentChanged event will be triggered
 * if triggerContentChangedEvent is set to true
 * @param core The StandaloneEditorCore object
 * @param content HTML content to set in
 * @param triggerContentChangedEvent True to trigger a ContentChanged event. Default value is true
 * @param metadata @optional Metadata of the content that helps editor know the selection and color mode.
 * If not passed, we will treat content as in light mode without selection
 */
export const setContent: SetContent = (core, content, triggerContentChangedEvent, metadata) => {
    let contentChanged = false;
    if (core.contentDiv.innerHTML != content) {
        core.api.triggerEvent(
            core,
            {
                eventType: PluginEventType.BeforeSetContent,
                newContent: content,
            },
            true /*broadcast*/
        );

        const entities = core.entity.entityMap;
        const html = content || '';
        const body = new DOMParser().parseFromString(
            core.trustedHTMLHandler?.(html) ?? html,
            'text/html'
        ).body;

        restoreContentWithEntityPlaceholder(body, core.contentDiv, entities);

        const metadataFromContent = extractContentMetadata(core.contentDiv);
        metadata = metadata || metadataFromContent;
        selectContentMetadata(core, metadata);
        contentChanged = true;
    }

    const isDarkMode = core.lifecycle.isDarkMode;

    if ((!metadata && isDarkMode) || (metadata && !!metadata.isDarkMode != !!isDarkMode)) {
        core.api.transformColor(
            core,
            core.contentDiv,
            false /*includeSelf*/,
            null /*callback*/,
            isDarkMode ? ColorTransformDirection.LightToDark : ColorTransformDirection.DarkToLight,
            true /*forceTransform*/,
            metadata?.isDarkMode
        );
        contentChanged = true;
    }

    if (triggerContentChangedEvent && contentChanged) {
        core.api.triggerEvent(
            core,
            {
                eventType: PluginEventType.ContentChanged,
                source: ChangeSource.SetContent,
            },
            false /*broadcast*/
        );
    }
};

function selectContentMetadata(core: StandaloneEditorCore, metadata: ContentMetadata | undefined) {
    if (!core.lifecycle.shadowEditFragment && metadata) {
        const selection = convertMetadataToDOMSelection(core, metadata);

        if (selection) {
            core.api.setDOMSelection(core, selection);
        }
    }
}

function convertMetadataToDOMSelection(
    core: StandaloneEditorCore,
    metadata: ContentMetadata | undefined
): DOMSelection | null {
    switch (metadata?.type) {
        case SelectionRangeTypes.Normal:
            return {
                type: 'range',
                range: createRange(core.contentDiv, metadata.start, metadata.end),
            };
        case SelectionRangeTypes.TableSelection:
            const table = queryElements(
                core.contentDiv,
                '#' + metadata.tableId
            )[0] as HTMLTableElement;

            return table
                ? {
                      type: 'table',
                      table: table,
                      firstColumn: metadata.firstCell.x,
                      firstRow: metadata.firstCell.y,
                      lastColumn: metadata.lastCell.x,
                      lastRow: metadata.lastCell.y,
                  }
                : null;
        case SelectionRangeTypes.ImageSelection:
            const image = queryElements(
                core.contentDiv,
                '#' + metadata.imageId
            )[0] as HTMLImageElement;

            return image
                ? {
                      type: 'image',
                      image: image,
                  }
                : null;

        default:
            return null;
    }
}
