import * as React from 'react';
import { ApiPaneProps } from '../ApiPaneProps';
import { Entity, InsertEntityOptions } from 'roosterjs-content-model-types';
import { insertEntity } from 'roosterjs-content-model-api';
import { trustedHTMLHandler } from '../../../../utils/trustedHTMLHandler';

const styles = require('./InsertEntityPane.scss');

interface InsertEntityPaneState {
    entities: Entity[];
}

export default class InsertEntityPane extends React.Component<ApiPaneProps, InsertEntityPaneState> {
    private entityType = React.createRef<HTMLInputElement>();
    private html = React.createRef<HTMLTextAreaElement>();
    private styleInline = React.createRef<HTMLInputElement>();
    private styleBlock = React.createRef<HTMLInputElement>();
    private focusAfterEntity = React.createRef<HTMLInputElement>();

    private posFocus = React.createRef<HTMLInputElement>();
    private posTop = React.createRef<HTMLInputElement>();
    private posBottom = React.createRef<HTMLInputElement>();
    private posRegionRoot = React.createRef<HTMLInputElement>();

    constructor(props: ApiPaneProps) {
        super(props);
        this.state = {
            entities: [],
        };
    }

    render() {
        return (
            <>
                <div>
                    Type: <input type="input" ref={this.entityType} />
                </div>
                <div>
                    HTML: <textarea className={styles.textarea} ref={this.html}></textarea>
                </div>
                <div>
                    Style:
                    <input
                        type="radio"
                        name="entityStyle"
                        ref={this.styleInline}
                        id="styleInline"
                    />
                    <label htmlFor="styleInline">Inline</label>
                    <input type="radio" name="entityStyle" ref={this.styleBlock} id="styleBlock" />
                    <label htmlFor="styleBlock">Block</label>
                </div>
                <div>
                    Position:
                    <br />
                    <input type="radio" name="position" ref={this.posFocus} id="posFocus" />
                    <label htmlFor="posFocus">Current focus</label>
                    <br />
                    <input type="radio" name="position" ref={this.posTop} id="posTop" />
                    <label htmlFor="posTop">Top</label>
                    <br />
                    <input type="radio" name="position" ref={this.posBottom} id="posBottom" />
                    <label htmlFor="posBottom">Bottom</label>
                    <br />
                    <input
                        type="radio"
                        name="position"
                        ref={this.posRegionRoot}
                        id="posRegionRoot"
                    />
                    <label htmlFor="posRegionRoot">Region root</label>
                    <br />
                </div>
                <div>
                    <input id="focusAfterEntity" type="checkbox" ref={this.focusAfterEntity} />
                    <label htmlFor="focusAfterEntity">Focus after entity</label>
                </div>
                <div>
                    <button onClick={this.insertEntity}>Insert Entity</button>
                </div>
                <hr />
                {/* <div>
                    <button onClick={this.onGetEntities}>Get all entities</button>
                </div>
                <div>
                    {this.state.entities.map(entity => (
                        <EntityButton key={entity.id} entity={entity} />
                    ))}
                </div> */}
            </>
        );
    }

    private insertEntity = () => {
        const entityType = this.entityType.current.value;
        const node = document.createElement('span');
        node.innerHTML = trustedHTMLHandler(this.html.current.value);
        const isBlock = this.styleBlock.current.checked;
        const focusAfterEntity = this.focusAfterEntity.current.checked;
        const insertAtTop = this.posTop.current.checked;
        const insertAtBottom = this.posBottom.current.checked;
        const insertAtRoot = this.posRegionRoot.current.checked;

        if (node) {
            const editor = this.props.getEditor();
            const options: InsertEntityOptions = {
                contentNode: node,
                focusAfterEntity: focusAfterEntity,
            };

            editor.focus();

            if (isBlock) {
                insertEntity(
                    editor,
                    entityType,
                    true,
                    insertAtRoot
                        ? 'root'
                        : insertAtTop
                        ? 'begin'
                        : insertAtBottom
                        ? 'end'
                        : 'focus',
                    options
                );
            } else {
                insertEntity(
                    editor,
                    entityType,
                    isBlock,
                    insertAtTop ? 'begin' : insertAtBottom ? 'end' : 'focus',
                    options
                );
            }
        }
    };

    // TODO: private onGetEntities = () => {
    //     const selector = getEntitySelector();
    //     const nodes = this.props.getEditor().queryElements(selector);
    //     const allEntities = nodes.map(node => getEntityFromElement(node));

    //     this.setState({
    //         entities: allEntities.filter(e => !!e),
    //     });
    // };
}

// TODO: function EntityButton({ entity }: { entity: Entity }) {
//     let background = '';
//     const onMouseOver = React.useCallback(() => {
//         background = entity.wrapper.style.backgroundColor;
//         entity.wrapper.style.backgroundColor = 'blue';
//     }, [entity]);

//     const onMouseOut = React.useCallback(() => {
//         entity.wrapper.style.backgroundColor = background;
//     }, [entity]);

//     return (
//         <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
//             Type: {entity.type}
//             <br />
//             Id: {entity.id}
//             <br />
//             Readonly: {entity.isReadonly ? 'True' : 'False'}
//             <br />
//         </div>
//     );
// }
