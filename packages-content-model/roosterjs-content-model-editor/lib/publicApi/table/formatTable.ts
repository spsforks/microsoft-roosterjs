import { applyTableFormat } from '../../modelApi/table/applyTableFormat';
import { formatWithContentModel } from '../utils/formatWithContentModel';
import { getFirstSelectedTable } from '../../modelApi/selection/collectSelections';
import { IContentModelEditor } from '../../publicTypes/IContentModelEditor';
import { TableMetadataFormat } from 'roosterjs-content-model-types';
import { updateTableCellMetadata } from 'roosterjs-content-model/lib';

/**
 * Format current focused table with the given format
 * @param editor The editor instance
 * @param format The table format to apply
 * @param keepCellShade Whether keep existing shade color when apply format if there is a manually set shade color
 */
export default function formatTable(
    editor: IContentModelEditor,
    format: TableMetadataFormat,
    keepCellShade?: boolean
) {
    formatWithContentModel(editor, 'formatTable', model => {
        const [tableModel] = getFirstSelectedTable(model);

        if (tableModel) {
            // Wipe border metadata
            tableModel.rows.forEach(row => {
                row.cells.forEach(cell => {
                    updateTableCellMetadata(cell, metadata => {
                        metadata = metadata || {};
                        metadata.borderOverride = false;
                        return metadata;
                    });
                });
            });
            applyTableFormat(tableModel, format, keepCellShade);
            return true;
        } else {
            return false;
        }
    });
}
