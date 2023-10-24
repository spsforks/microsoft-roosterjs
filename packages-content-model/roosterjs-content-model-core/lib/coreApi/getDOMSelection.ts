import { SelectionRangeTypes } from 'roosterjs-editor-types';
import type { ContentModelEditorCore } from '../publicTypes/editor/ContentModelEditorCore';
import type { GetDOMSelection } from '../publicTypes/coreApi/GetDOMSelection';
import type { DOMSelection } from 'roosterjs-content-model-types';

/**
 * @internal
 */
export const getDOMSelection: GetDOMSelection = core => {
    return core.pluginState.cache.cachedSelection ?? getNewSelection(core);
};

function getNewSelection(core: ContentModelEditorCore): DOMSelection | null {
    // TODO: Get rid of getSelectionRangeEx when we have standalone editor
    const rangeEx = core.api.getSelectionRangeEx(core);

    if (rangeEx.type == SelectionRangeTypes.Normal && rangeEx.ranges[0]) {
        return {
            type: 'range',
            range: rangeEx.ranges[0],
        };
    } else if (rangeEx.type == SelectionRangeTypes.TableSelection && rangeEx.coordinates) {
        return {
            type: 'table',
            table: rangeEx.table,
            firstColumn: rangeEx.coordinates.firstCell.x,
            lastColumn: rangeEx.coordinates.lastCell.x,
            firstRow: rangeEx.coordinates.firstCell.y,
            lastRow: rangeEx.coordinates.lastCell.y,
        };
    } else if (rangeEx.type == SelectionRangeTypes.ImageSelection) {
        return {
            type: 'image',
            image: rangeEx.image,
        };
    } else {
        return null;
    }
}
