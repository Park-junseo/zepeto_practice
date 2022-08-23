import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Camera, Input, Physics, RaycastHit} from "UnityEngine";
 
export default class LayerExample extends ZepetoScriptBehaviour {
 
    Update()
    {
       this.MouseControl();
    }
   
    MouseControl()
    {
       if(Input.GetMouseButtonDown(0))
       {
           let ray = Camera.main.ScreenPointToRay(Input.mousePosition);
         
           // RaycatHit 참조변수를 파라메터로 넘기기 위해, $ref 연산자로 wrapping 하는 부분에 유의해주세요.
           // (매개변수 한정자 out이 필요한 상황이기때문에) 객체 생성 없이 참조만 선언해줍니다.            
           let ref = $ref<RaycastHit>();    
         
           if(Physics.Raycast(ray, ref, 1000))
           {
               // RaycatHit 데이터를 확인하기 위해, $unref 연산자로 다시 unwrapping 하는 부분에 유의해주세요.
               let hitInfo = $unref(ref);  
             
               console.log(`Detect Hit!`);    
               console.log(`hitInfo.collider.name : ${hitInfo.collider.name}`);
         
           } else {
               console.log(`Failed to Detect Collision`);
           }
       }
    }

    /*
   Update(){
       if(Input.GetMouseButtonDown(0)){
           let ray = Camera.main.ScreenPointToRay(Input.mousePosition);
           let ref = $ref<RaycastHit>();
             
           let layerMask = 1 << 20;
             
           if (Physics.Raycast(ray, ref, 100, layerMask))
           {
               let hitInfo = $unref(ref);
               console.log(`name : ${hitInfo.collider.gameObject.name}`);
           }
       }
   }
    */
}