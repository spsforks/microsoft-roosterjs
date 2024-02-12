import {
    getAllEntityWrappers,
    isEntityElement,
    isNodeOfType,
    parseEntityClassName,
    reuseCachedElement,
} from 'roosterjs-content-model-dom';
import type {
    Snapshot,
    StandaloneEditorCore,
    KnownEntityItem,
    ContentModelEntityFormat,
} from 'roosterjs-content-model-types';

const BlockEntityContainer = '_E_EBlockEntityContainer';

/**
 * @internal
 */
export function restoreSnapshotHTML(core: StandaloneEditorCore, snapshot: Snapshot) {
    const {
        contentDiv,
        entity: { entityMap },
    } = core;
    let refNode: Node | null = contentDiv.firstChild;

    const body = new DOMParser().parseFromString(
        core.trustedHTMLHandler?.(snapshot.html) ?? snapshot.html,
        'text/html'
    ).body;

    for (let currentNode = body.firstChild; currentNode; ) {
        const next = currentNode.nextSibling;
        const originalEntityElement = tryGetEntityElement(entityMap, currentNode);

        if (originalEntityElement) {
            refNode = reuseCachedElement(contentDiv, originalEntityElement, refNode);
        } else {
            contentDiv.insertBefore(currentNode, refNode);

            if (isNodeOfType(currentNode, 'ELEMENT_NODE')) {
                const childEntities = getAllEntityWrappers(currentNode);

                childEntities.forEach(element => {
                    const wrapper = tryGetEntityElement(entityMap, element);

                    if (wrapper) {
                        if (wrapper == refNode) {
                            // In case the node we are moving is just the ref node,
                            // We create a temporary clone and insert it before the refNode, the use this cloned node as refNode
                            // Then after replaceChild(), the original refNode will be moved away
                            const markerNode = wrapper.cloneNode();

                            contentDiv.insertBefore(markerNode, refNode);
                            refNode = markerNode;
                        }

                        element.parentNode?.replaceChild(wrapper, element);
                    }
                });
            }
        }
        currentNode = next;
    }

    while (refNode) {
        const next = refNode.nextSibling;

        refNode.parentNode?.removeChild(refNode);
        refNode = next;
    }
}

function tryGetEntityElement(
    entityMap: Record<string, KnownEntityItem>,
    node: Node
): HTMLElement | null {
    let result: HTMLElement | null = null;

    if (isNodeOfType(node, 'ELEMENT_NODE')) {
        if (isEntityElement(node)) {
            const format: ContentModelEntityFormat = {};

            node.classList.forEach(name => {
                parseEntityClassName(name, format);
            });

            result = (format.id && entityMap[format.id]?.element) || null;
        } else if (isBlockEntityContainer(node)) {
            result = tryGetEntityFromContainer(node, entityMap);
        }
    }

    return result;
}
function isBlockEntityContainer(node: HTMLElement) {
    return node.classList.contains(BlockEntityContainer);
}

function tryGetEntityFromContainer(
    element: HTMLElement,
    entityMap: Record<string, KnownEntityItem>
): HTMLElement | null {
    const format: ContentModelEntityFormat = {};
    element.childNodes.forEach(node => {
        if (isEntityElement(node) && isNodeOfType(node, 'ELEMENT_NODE')) {
            node.classList.forEach(name => parseEntityClassName(name, format));
        }
    });

    const parent = format.id ? entityMap[format.id]?.element.parentElement : null;

    return isNodeOfType(parent, 'ELEMENT_NODE') && isBlockEntityContainer(parent) ? parent : null;
}
