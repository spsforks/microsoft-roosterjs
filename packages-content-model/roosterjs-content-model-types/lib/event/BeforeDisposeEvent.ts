import { BasePluginEvent } from './BasePluginEvent';

/**
 * Provides a chance for plugin to change the content before it is pasted into editor.
 */
export interface BeforeDisposeEvent extends BasePluginEvent<'beforeDispose'> {}
