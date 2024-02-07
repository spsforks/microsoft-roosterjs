import { adjustWordSelection } from '../../modelApi/selection/adjustWordSelection';
import { getSelectedSegmentsAndParagraphs } from 'roosterjs-content-model-core';
import type {
    ContentModelDocument,
    ContentModelParagraph,
    ContentModelSegment,
    ContentModelSegmentFormat,
    IStandaloneEditor,
} from 'roosterjs-content-model-types';

/**
 * @internal
 */
export function formatSegmentWithContentModel(
    editor: IStandaloneEditor,
    apiName: string,
    toggleStyleCallback: (
        format: ContentModelSegmentFormat,
        isTuringOn: boolean,
        segment: ContentModelSegment | null,
        paragraph: ContentModelParagraph | null
    ) => void,
    segmentHasStyleCallback?: (
        format: ContentModelSegmentFormat,
        segment: ContentModelSegment | null,
        paragraph: ContentModelParagraph | null
    ) => boolean,
    includingFormatHolder?: boolean,
    afterFormatCallback?: (model: ContentModelDocument) => void
) {
    editor.formatContentModel(
        (model, context) => {
            let segmentAndParagraphs = getSelectedSegmentsAndParagraphs(
                model,
                !!includingFormatHolder
            );
            let isCollapsedSelection =
                segmentAndParagraphs.length == 1 &&
                segmentAndParagraphs[0][0].segmentType == 'SelectionMarker';

            if (isCollapsedSelection) {
                const para = segmentAndParagraphs[0][1];

                segmentAndParagraphs = adjustWordSelection(
                    model,
                    segmentAndParagraphs[0][0]
                ).map(x => [x, para]);

                if (segmentAndParagraphs.length > 1) {
                    isCollapsedSelection = false;
                }
            }

            const formatsAndSegments: [
                ContentModelSegmentFormat,
                ContentModelSegment | null,
                ContentModelParagraph | null
            ][] = segmentAndParagraphs.map(item => [item[0].format, item[0], item[1]]);

            const isTurningOff = segmentHasStyleCallback
                ? formatsAndSegments.every(([format, segment, paragraph]) =>
                      segmentHasStyleCallback(format, segment, paragraph)
                  )
                : false;

            formatsAndSegments.forEach(([format, segment, paragraph]) =>
                toggleStyleCallback(format, !isTurningOff, segment, paragraph)
            );

            afterFormatCallback?.(model);

            if (isCollapsedSelection) {
                context.newPendingFormat = segmentAndParagraphs[0][0].format;
                editor.focus();
                return false;
            } else {
                return formatsAndSegments.length > 0;
            }
        },
        {
            apiName,
        }
    );
}
