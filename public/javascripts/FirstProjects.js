//*******
//The program is launched with the following command: node FirstProejcts.js shipOrder.xml shipOrder.xsd
//where shipOrder.xml is the name of xml file for validation
//and shipOrder.xsd is the name of xsd file
//*******

module.exports = function validator (xmlStr)
{
var validator = require('xsd-schema-validator');
var fs = require('fs');

// //read xml file name from command line
// //argv[0] is node; argv[1] is FirstProjects.js; argv[2] is the name of XML file; argv[3] is the name of schema file
// var xmlFileName = "shipOrder.xml";
// //console.log('The entered XML file name is: ' + xmlFileName);
// //process.exit(0);
//
// //check existence of the XML file in the folder. If file does not exists, exit the program
// try {
//     fs.accessSync(xmlFileName, fs.F_OK);
// } catch (e) {
//     console.log('XML file ' + xmlFileName + ' is not accessible. Existing the program');
//     console.log(e);
//     process.exit(1);
// }
// var xmlStr = fs.readFileSync(xmlFileName).toString();
// console.log('Have read the following data: ');
// console.log(xmlStr);

//read schema file name
var xsdFileName = "shipOrder.xsd";
//check existence of schema file
try {
    fs.accessSync(xsdFileName, fs.F_OK);
} catch (e) {
    console.log('XSD file ' + xsdFileName + ' is not accessible. Existing the program');
    console.log(e);
    process.exit(1);
}


validator.validateXML(xmlStr, xsdFileName, function(err, result) {
  if (err) {
    console.log('Error was found during validation of file ' + xmlFileName + ':');
    console.log(err);
    process.exit(1);
  }
   console.log('XML file is valid: ' + result.valid); // true
    return true ;
});

};
