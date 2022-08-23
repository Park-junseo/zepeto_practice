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
         
           // RaycatHit ���������� �Ķ���ͷ� �ѱ�� ����, $ref �����ڷ� wrapping �ϴ� �κп� �������ּ���.
           // (�Ű����� ������ out�� �ʿ��� ��Ȳ�̱⶧����) ��ü ���� ���� ������ �������ݴϴ�.            
           let ref = $ref<RaycastHit>();    
         
           if(Physics.Raycast(ray, ref, 1000))
           {
               // RaycatHit �����͸� Ȯ���ϱ� ����, $unref �����ڷ� �ٽ� unwrapping �ϴ� �κп� �������ּ���.
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