import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {WaitForSeconds} from "UnityEngine";
import { GameObject, Object, Transform, Animator, Light , Vector3} from "UnityEngine";
 
export default class GameObjectSample extends ZepetoScriptBehaviour {

    public myInstance:GameObject;    

    Start() {
        //GameObject Create
        // var tempObj = new GameObject();
        var obj = Object.Instantiate(this.myInstance);

        obj.transform.Translate(new Vector3(1,1,1));
 
        ////GameObject Destroy
        //Object.Destroy(obj);
 
        // GetComponent with Generic
        var myTransform = this.GetComponent<Transform>();
 
        // AddComponent with Generic
        var animator = this.gameObject.AddComponent<Animator>()
        
        this.StartCoroutine(this.DestroyCounter(obj));;
    }

    *DestroyCounter(instance:GameObject) {
        yield null;
        yield new WaitForSeconds(20);
        Object.Destroy(instance);
        console.log("Destroy");
    }
}