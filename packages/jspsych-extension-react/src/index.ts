import {JsPsych, JsPsychExtension, JsPsychExtensionInfo} from "jspsych";
import {createRoot} from "react-dom/client"

interface InitializeParameters {
}

interface OnStartParameters {
}

interface OnLoadParameters {
  component: Function,
  trial: {}
  stimulus: {}
}

interface OnFinishParameters {
}

/**
 * **React Extension**
 *
 * Render React components in jsPsych timelines.
 *
 * @author John Muchovej
 * @see {@link https://john.muchovej.com/projects/jspsych-extension-react/}
 */
class ReactDOMExtension implements JsPsychExtension {
  static info: JsPsychExtensionInfo = {
    name: "react",
  };

  private container!: HTMLElement;
  protected root: any;

  constructor(private readonly jsPsych: JsPsych) {
    this.jsPsych = jsPsych
  }

  initialize({}: InitializeParameters): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  };

  on_start({}): void {
    this.container = this.jsPsych.getDisplayElement()
    this.root = createRoot(this.container)
  };

  on_load({ component, stimulus }: OnLoadParameters): void {
    this.render(component, stimulus)
  };

  on_finish({}: OnFinishParameters): { [key: string]: any } {
    this.root.unmount()
    return {}
  };

  public render(component: Function, params: {} = {}): void {
    this.root.render(component({jsPsych: this.jsPsych, ...params}))
  }
}

export default ReactDOMExtension;
