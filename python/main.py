from omegaconf import OmegaConf
from util import load_config
import os
from js2cpp import Js2Cpp
from cpp2js import Cpp2Js


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(here, "config.yaml")
    config: OmegaConf = load_config(config_path)
    js2cpp = Js2Cpp(config)
    cpp2js = Cpp2Js(config)
    js2cpp.start()
    cpp2js.start()
    try:
        js2cpp.join()
        cpp2js.join()
    except KeyboardInterrupt:
        js2cpp.stop()
        cpp2js.stop()
        js2cpp.join()
        cpp2js.join()
    

if __name__ == "__main__":
    main()