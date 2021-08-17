window.onload = function () {
    let requestURL = "https://sdat-dev.github.io/resources/wiser/data/researchers.json"; 
    let datarequestURL = "https://sdat-dev.github.io/resources/wiser/data/researchersdata.json"; 
    let request =  axios.get(requestURL);
    let datarequest =  axios.get(datarequestURL);
    let maincontentContainer = document.getElementsByClassName('main-content')[0];
    axios.all([request, datarequest]).then(axios.spread((...responses) => {
        let researcherscontent =  responses[0].data;
        let researchers = responses[1].data;
        let webelements = researcherscontent;
        let content = getContent(webelements);
        content += '<input id = "search-box" placeholder = "Search Researchers...">'+
                    '<button id = "search-button" type = "submit"><i class="fa fa-search"></i></button>'+
                '<br><span id = "search-box-results"></span>';
        content +='<div id="experts-content">'+buildResearchersContent(researchers)+'</div>';
        let contentElement = document.createElement('div');
        contentElement.classList.add('content');
        contentElement.innerHTML = content.trim();
        maincontentContainer.appendChild(contentElement);
        addfooter();
        let searchbox = document.getElementById('search-box');
        let searchbutton = document.getElementById('search-button');
        searchbox.onkeyup = searchfunction;
        searchbutton.onclick = searchfunction;

    })).catch(errors => {
        console.log(errors);
    })
}

let buildResearchersContent = function(experts){
    let content = '';
    let universityResearchers = experts.filter(function(expert){
        return (expert["UniversityInstitution"] == "UAlbany") || (expert["UniversityInstitution"] == "Uconn");
    });
    let otherResearchers = experts.filter(function(expert){
        return (expert["UniversityInstitution"] != "UAlbany") && (expert["UniversityInstitution"] != "Uconn");
    });
    let tabattribute = "UniversityInstitution"
    let distincttabs = getDistinctAttributes(universityResearchers, 'UniversityInstitution'); 
    distincttabs.push("Other Organizations");
    content = createTabNavigation(distincttabs, tabattribute);
    let tabContent = [];
    for(let i = 0; i< distincttabs.length; i++){
        let tabexperts = universityResearchers.filter(function(expert){
            return expert.UniversityInstitution == distincttabs[i];
        });
        let tabId = "";
        if(distincttabs[i] != "Other Organizations")
        {
            tabId = tabattribute + i.toString();
            tabContent.push(buildUniversityResearchers(tabId, tabexperts));
        }
        else
        {
            tabId = tabattribute + i.toString();
            tabContent.push(buildOtherResearchers(tabId, otherResearchers));
        }
        
    }

    content += buildTabContent(distincttabs, tabattribute, tabContent);
    return content;
}

//Start with level1 accordion and build one by one the levels going down.
//this is nestted accordion that can go upto 4 levels
let counter = 1;
let buildUniversityResearchers = function(tabId, tabexperts){
    let contactElem = '';
    contactElem +=  '<div class = "accordion-container">'+
                        '<div class="panel-group" id = "' + tabId + '" role="tablist" aria-multiselectable="true">';
    let distinctLevel1s = getDistinctAttributes(tabexperts, 'UAlbanyCollegeSchoolDivision');
    distinctLevel1s.sort();
    var index = distinctLevel1s.indexOf("");
    if(index != -1)
    {
        distinctLevel1s.splice(index, 1);
        distinctLevel1s.push("");
    }
    distinctLevel1s.forEach(function(level1) {
        let collapseId1 = "collapse" + counter;
        let headerId1 = "heading" + counter;
        let childId1 = "child" + counter;
        counter++;
        let level2Elem = '';
        //filter level2s
        let level2s = tabexperts.filter(function(expert){
            return expert.Q17 == level1;
        }); 

        if(level2s.length > 0)
        {
            let distinctLevel2s = getDistinctAttributes(level2s, 'DepartmentUnitOffice');
            distinctLevel2s.sort();
            distinctLevel2s.forEach(function(level2){
                //filter level3 
                let level3s = level2s.filter(function(expert){
                    return expert.DepartmentUnitOffice == level2;
                });
                level3s.sort((a,b) => b.firstName - a.firstName)
                //for level2s build simple list
                level2Elem+= buildUniversityResearcherElements(level3s);
            });
        }  
        if(level1 == "")
        {
            level1 = "Other";
        }
        contactElem+= generateAccordionElem(1, collapseId1, headerId1, tabId, childId1, level1, level2Elem);
    });
    contactElem +=      '</div>'+
                    '</div>';
    //end level1 accordion
    return contactElem;
}

let buildUniversityResearcherElements = function(researchers){
    let content = '';
    for(var i=0; i< researchers.length; i++){
        if(researchers[i].Q12 == "") //skip of there is no first name
            continue;
        let researcher = researchers[i];
        content +='<div class = "search-container expert-info">'+
        '<img class = "expert-image" src = "https://sdat-dev.github.io/resources/healthequity/assets/images/researchers/' + ((researcher["Q24_Name"] != '' && !researcher["Q24_Name"].includes(".docx"))? researcher.ResponseId+'_'+researcher["Q24_Name"]  : 'placeholder.jpg') +'"/>'+
        '<h2 class = "content-header-no-margin">'+ (researcher["UniversityInstitutionalPage"] == ""? researcher.FirstName + ' '+ researcher.LastName : '<a class = "no-link-decoration" href = ' + getHttpLink(researcher["UniversityInstitutionalPage"]) + '>' + researcher.FirstName + ' '+ researcher.LastName + '</a>') + '</h2>'+
        '<h5 class = "content-header-no-margin faculty-title" style = "font-size:20px;">'+ (researcher.JobTitle != ''? researcher.JobTitle + ',<br>':'') + (researcher.DepartmentUnitOffice != ''? researcher.DepartmentUnitOffice :'') + '</h5>' +
        generateLogoContent(researcher) +'<p class = "faculty-description"><strong>Email: </strong> <a class = "email-link" href = mailto:' + researcher.Email2 + 
        '>'+ researcher.Email2+ '</a><br>'+ (researcher.PhoneNumber != ""? '<strong>Phone: </strong>'+ formatPhone(researcher.PhoneNumber) + '<br>': "")+'<strong>Research Interests: </strong>'+ 
        getResearchInterests(researcher) + '</p><p>' + researcher.ResearchExpertise +'</p>'+ generateProjectsContent([researcher["Project1"],researcher["Project2"],researcher["Project3"],researcher["Project4"],researcher["Project5"]])+
        generateRelevantCourses([researcher["Course1"],researcher["Course2"],researcher["Course3"],researcher["Course4"],researcher["Course5"]]);
    }
    return content;
}

let buildOtherResearchers = function(tabId, tabresearchers){
    let contactElem = '';
    contactElem += '<div class="panel-group" id = "' + tabId + '" role="tablist" aria-multiselectable="true">';
    let distinctLevel1s = getDistinctOrganizations(tabresearchers);
    distinctLevel1s.sort();
    var index = distinctLevel1s.indexOf("");
    if(index != -1)
    {
        distinctLevel1s.splice(index, 1);
        distinctLevel1s.push("");
    }
    
    distinctLevel1s.forEach(function(level1) {
        let collapseId1 = "collapse" + counter;
        let headerId1 = "heading" + counter;
        let childId1 = "child" + counter;
        counter++;
        let level2Elem = '';
        //filter level2s
        let level2s = tabresearchers.filter(function(researcher){
            return (researcher["UniversityInstitution"] == "") ? "Other" == level1 : researcher["UniversityInstitution"] == level1;
        }); 
        if(level2s.length > 0)
        {
            let distinctLevel2s = getDistinctDivisions(level2s);
            distinctLevel2s.sort();
            distinctLevel2s.forEach(function(level2){
                //filter level3 
                let level3s = level2s.filter(function(researcher){
                    return (researcher["DepartmentUnitOffice"] == "") ? researcher.DepartmentUnitOffice == level2 : researcher.DepartmentUnitOffice == level2;
                });
                level3s.sort((a,b) => b.firstName - a.firstName)
                //for level2s build simple list
                level2Elem+= buildOtherResearcherElements(level3s);
            });
        } 

        if(level1 == "")
        {
            level1 = "Other";
        }

        contactElem+= generateAccordionElem(1, collapseId1, headerId1, tabId, childId1, level1, level2Elem);
    });
    contactElem += '</div>';
    //end level1 accordion
    return contactElem;
}

let getDistinctOrganizations = function(researchers){
    let mappedAttributes = researchers.map(function(researcher){
        return  (researcher["UniversityInstitution"] == "") ? "Other" : researcher["UniversityInstitution"];
    });
    let distinctOrganizations = mappedAttributes.filter(function(v, i, a){
        return a.indexOf(v) === i;
     });

    return distinctOrganizations;
}

let getDistinctDivisions = function(researchers){
    let mappedAttributes = researchers.map(function(researcher){
        return  (researcher["DepartmentUnitOffice"] == "") ? researcher.DepartmentUnitOffice : researcher.DepartmentUnitOffice;
    });
    let distinctDivisions = mappedAttributes.filter(function(v, i, a){
        return a.indexOf(v) === i;
     });

    return distinctDivisions;
}

let buildOtherResearcherElements = function(researchers){
    let content = '';
    for(var i=0; i< researchers.length; i++){
        if(researchers[i].Q12 == "") //skip of there is no first name
            continue;
        let researcher = researchers[i];
        content +='<div class = "search-container expert-info">'+
        '<img class = "expert-image" src = "https://sdat-dev.github.io/resources/healthequity/assets/images/researchers/' + ((researcher["Q24_Name"] != '' && !researcher["Q24_Name"].includes(".docx"))? researcher.ResponseId+'_'+researcher["Q24_Name"]  : 'placeholder.jpg') +'"/>'+
        '<h2 class = "content-header-no-margin">'+ (researcher["UniversityInstitutionalPage"] == ""? researcher.FirstName + ' '+ researcher.LastName : '<a class = "no-link-decoration" href = ' + getHttpLink(researcher["UniversityInstitutionalPage"]) + '>' + researcher.FirstName + ' '+ researcher.LastName + '</a>') + '</h2>'+
        '<h5 class = "content-header-no-margin faculty-title" style = "font-size:20px;">'+ (researcher.JobTitle != ''? researcher.JobTitle + ',<br>':'') + (researcher.DepartmentUnitOffice != ''? researcher.DepartmentUnitOffice :'') + '</h5>' +
        generateLogoContent(researcher) +'<p class = "faculty-description"><strong>Email: </strong> <a class = "email-link" href = mailto:' + researcher.Email2 + 
        '>'+ researcher.Email2+ '</a><br>'+ (researcher.PhoneNumber != ""? '<strong>Phone: </strong>'+ formatPhone(researcher.PhoneNumber) + '<br>': "")+'<strong>Research Interests: </strong>'+ 
        getResearchInterests(researcher) + '</p><p>' + researcher.ResearchExpertise +'</p>'+ generateProjectsContent([researcher["Project1"],researcher["Project2"],researcher["Project3"],researcher["Project4"],researcher["Project5"]])+
        generateRelevantCourses([researcher["Course1"],researcher["Course2"],researcher["Course3"],researcher["Course4"],researcher["Course5"]]);
   }
    return content;
}

let generateOtherResearcherTitle = function(researcher){

    let title = '<h5 class = "content-header-no-margin faculty-title">'+ (researcher.Q15 != ''? researcher.Q15 + ',<br>':'');
    if(researcher["Q16"] == "")
        title += (researcher.Q16_7_TEXT != ''? researcher.Q16_7_TEXT + ', ' :'') + (researcher.Q19 != ''? researcher.Q19 :'')  
    else
        title +=  (researcher.Q17 == ''? '' : researcher.Q17);
    title += '</h5>';
    return title;
}

let generateLogoContent = function(expert){
    let onlineCVContent = (expert["CV"] == '')?'':
    '<a href = "'+ expert["CV"] +'"><img src = "https://sdat-dev.github.io/resources/healthequity/assets/images/cv.png"></a>'; 
    let researchGateContent = (expert["ResearchGate"]== '')?'':
    '<a href = "'+ expert["ResearchGate"] +'"><img src = "https://sdat-dev.github.io/resources/healthequity/assets/images/research-gate-logo.png"></a>'; 
    let googleScholarContent = (expert["GoogleScholar"] == '')?'':
    '<a href = "'+ expert["GoogleScholar"] +'"><img src = "https://sdat-dev.github.io/resources/healthequity/assets/images/google-scholar-logo.png"></a>'; 
    let otherContent = (expert["Others"] == '')?'':
    '<a href = "'+ expert["Others"] +'"><img src = "https://sdat-dev.github.io/resources/healthequity/assets/images/link.png"></a>'; 
    let linkContainer = '<div class = "display-flex icon-container">'+
    onlineCVContent + researchGateContent + googleScholarContent + otherContent + '</div>';
    return linkContainer;
}

let getResearchInterests = function(expert){
    let interests = "";
    interests += (expert["Keyword1"] == ''?  "" : expert["Keyword1"] +"; " )+ (expert["Keyword2"] == ''?  "":expert["Keyword2"] +"; ") + 
    (expert["Keyword3"] == ''?  "": expert["Keyword3"]+"; ") + (expert["Keyword4"]== ''?  "":expert["Keyword4"] +"; " )+
    (expert["Keyword5"] == ''?  "":expert["Keyword5"] +"; ") + (expert["Keyword6"]== ''?"":expert["Keyword6"]+"; ") +
     expert["Keyword7"] ; 
    return interests;
}

let generateProjectsContent = function(projects){
    let linkContent = '';
    let projectcount = 0;
    for(let i = 0; i < projects.length; i++)
    {
      if('' != projects[i])
      {
        linkContent = linkContent + '<li>'+ projects[i] + '</li>';
        projectcount++;
      }
    }
    linkContent = (projectcount > 0)?
    '<b class = "purple-font">Ongoing Research/Scholarship Related Projects</b><ul class = "sub-list">'
    + linkContent + '</ul>': '';
    return linkContent;
}

let generateRelevantCourses = function(courses){
    let courseContent = '';
    let count = 0;
    for(let i = 0; i < courses.length; i++)
    {
      if('' != courses[i])
      {
        courseContent = courseContent + '<li>'+ courses[i] + '</li>';
        count++;
      }
    }
    courseContent = (count > 0)?
    '<b class = "purple-font">RELEVANT COURSES</b><ul class = "sub-list">'
    + courseContent + '</ul>': '';
    return courseContent;
}

//Search Function
searchfunction = function () {
    //getting search-box Element
    let searchbox = document.getElementById('search-box');
    let searchtext = searchbox.value.trim();
    let tabs =  document.getElementsByClassName('tab-pane');
    //getting individual content withing sub-accordions to toggle display
    let panels = document.getElementsByClassName('panel');
    let searchElems = document.getElementsByClassName('search-container');
    clearsearch();
    if (panels.length > 0) {
        for (let i = 0; i < panels.length; i++) {
            panels[i].style.display = "none";
        }
    }

    if (searchElems.length > 0) {
        for (let i = 0; i < searchElems.length; i++) {
            searchElems[i].style.display = "none";
        }
    }

    if(searchtext.length > 0)
    {
        let modifiedsearchtext = searchtext.replace(/\s+/g, '').toLowerCase();

        for(let i=0; i < tabs.length; i++){
            let tabpanels = tabs[i].getElementsByClassName('panel');
            let count = 0;
            for(let j=0; j< tabpanels.length; j++){
                let searchElems = tabpanels[j].getElementsByClassName('search-container');
                for (let k = 0; k < searchElems.length; k++) {
                    if (searchElems[k].textContent.replace(/\s+/g, '').toLowerCase().indexOf(modifiedsearchtext) >= 0) {
                        count++;
                        searchElems[k].style.display = "block";
                        tabpanels[j].style.display = "block";
                    }
                }
            }
            let tabid = tabs[i].getAttribute("Id");
            let tabpill = document.getElementById('#'+tabid);
            tabpill.innerText = tabpill.innerText + ' (' + count + ')';
        }
    }
    else{

        clearsearch();
    } 
}

let clearsearch = function(){
    let tabs =  document.getElementsByClassName('tab-pane');
    let panels = document.getElementsByClassName('panel');
    let searchElems = document.getElementsByClassName('search-container');
    for(let i=0; i < tabs.length; i++){
        let tabid = tabs[i].getAttribute("Id");
        let tabpill = document.getElementById('#'+tabid);
        let tabtext = tabpill.innerText;
        let pos = tabtext.indexOf("(");
        if(pos != -1)
        {
            tabpill.innerText = tabtext.substring(0, pos-1);
        }
    }

    if (panels.length > 0) {
        for (let i = 0; i < panels.length; i++) {
            panels[i].style.display = "block";
        }
    }

    if (searchElems.length > 0) {
        for (let i = 0; i < searchElems.length; i++) {
            searchElems[i].style.display = "block";
        }
    }
}

let formatPhone = function(text){
    let result = text;
    if(isNaN(text) == false){
        result = (text/10000000 |0)+ '-' + ((text/10000)%1000|0) + '-' + text%10000
    }
    return result;
}

let getHttpLink = function(link){
    let result = link;
    if(link != "" && link.indexOf("http") == -1){
        result = "https://" + link;
    }
    return result;
}

$('.carousel').carousel({pause: null});