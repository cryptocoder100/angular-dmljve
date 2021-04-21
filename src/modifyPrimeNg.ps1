$jsCode = Get-Content node_modules\primeng\fesm5\primeng-confirmdialog.js

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-confirmdialog.js
}

$jsCode = Get-Content node_modules\primeng\fesm5\primeng-confirmdialog.js.map

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-confirmdialog.js.map
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-confirmdialog.js

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-confirmdialog.js
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-confirmdialog.js.map

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-confirmdialog.js.map
}

$jsCode = Get-Content node_modules\primeng\esm5\confirmdialog\confirmdialog.js

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\esm5\confirmdialog\confirmdialog.js
}

$jsCode = Get-Content node_modules\primeng\esm2015\confirmdialog\confirmdialog.js

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\esm2015\confirmdialog\confirmdialog.js
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-confirmdialog.umd.js

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-confirmdialog.umd.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-confirmdialog.umd.js.map

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-confirmdialog.umd.js.map
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-confirmdialog.umd.min.js

if (-not ($jsCode -match 'this\.container&&!this\.cd\[''destroyed''\]&&this\.cd\.detectChanges')) {
    $jsCode -replace "this\.container&&this\.cd\.detectChanges", "this.container&&!this.cd['destroyed']&&this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-confirmdialog.umd.min.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-confirmdialog.umd.min.js.map

if (-not ($jsCode -match 'if \(!this\.cd\[''destroyed''\]\) this\.cd\.detectChanges')) {
    $jsCode -replace "this\.cd\.detectChanges", "if (!this.cd['destroyed']) this.cd.detectChanges"| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-confirmdialog.umd.min.js.map
}










$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js.map
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js

if (-not ($jsCode -match 'title="First Page"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\"isFirstPage\(\) \? null \: ''0''\" class=\"ui-paginator-first', '<a tabindex="0" title="First Page" [attr.tabindex]="isFirstPage() ? null : ''0''" class="ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js.map
}






$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js.map
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js

if (-not ($jsCode -match 'title="Previous Page"')) {
    $jsCode -replace '\<a tabindex=\"0\" \[attr\.tabindex\]\=\"isFirstPage\(\) \? null \: ''0''\" class=\"ui-paginator-prev', '<a tabindex="0" title="Previous Page" [attr.tabindex]="isFirstPage() ? null : ''0''" class="ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js.map
}




$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js.map
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js

if (-not ($jsCode -match 'title="Next Page"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\"isLastPage\(\) \? null \: ''0''\" class=\"ui-paginator-next', '<a tabindex="0" title="Next Page" [attr.tabindex]="isLastPage() ? null : ''0''" class="ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js.map
}





$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js.map
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js

if (-not ($jsCode -match 'title="Last Page"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\"isLastPage\(\) \? null \: ''0''\" class=\"ui-paginator-last', '<a tabindex="0" title="Last Page" [attr.tabindex]="isLastPage() ? null : ''0''" class="ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js.map

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js.map
}







$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm5\primeng-paginator.js.map

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\fesm5\primeng-paginator.js.map
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js

if (-not ($jsCode -match '\[title\]="pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\"0\" \*ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page', '<a tabindex="0" [title]="pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''" *ngFor="let pageLink of pageLinks" class="ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js
}

$jsCode = Get-Content node_modules\primeng\fesm2015\primeng-paginator.js.map

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\fesm2015\primeng-paginator.js.map
}









$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js.map

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js.map
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js

if (-not ($jsCode -match 'title="First Page"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\"isFirstPage\(\) \? null \: \\''0\\''\" class=\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : \''0\''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js.map

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js.map
}

$jsCode = Get-Content node_modules\primeng\paginator\primeng-paginator.metadata.json

if (-not ($jsCode -match 'title=\"First Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-first', '<a tabindex=\"0\" title=\"First Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-first'| Out-File -encoding ASCII node_modules\primeng\paginator\primeng-paginator.metadata.json
}



$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js.map

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js.map
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js

if (-not ($jsCode -match 'title="Previous Page"')) {
    $jsCode -replace '\<a tabindex=\"0\" \[attr\.tabindex\]\=\"isFirstPage\(\) \? null \: \\''0\\''\" class=\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : \''0\''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js.map

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js.map
}

$jsCode = Get-Content node_modules\primeng\paginator\primeng-paginator.metadata.json

if (-not ($jsCode -match 'title=\"Previous Page\"')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \[attr\.tabindex\]\=\\\"isFirstPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-prev', '<a tabindex=\"0\" title=\"Previous Page\" [attr.tabindex]=\"isFirstPage() ? null : ''0''\" class=\"ui-paginator-prev'| Out-File -encoding ASCII node_modules\primeng\paginator\primeng-paginator.metadata.json
}









$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js.map

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js.map
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js

if (-not ($jsCode -match 'title="Next Page"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\"isLastPage\(\) \? null \: \\''0\\''\" class=\"ui-paginator-next', '<a tabindex="0" title="Next Page" [attr.tabindex]="isLastPage() ? null : \''0\''" class="ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js.map

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js.map
}

$jsCode = Get-Content node_modules\primeng\paginator\primeng-paginator.metadata.json

if (-not ($jsCode -match 'title=\"Next Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-next', '<a tabindex=\"0\" title=\"Next Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-next'| Out-File -encoding ASCII node_modules\primeng\paginator\primeng-paginator.metadata.json
}



$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js.map

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js.map
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js
if (-not ($jsCode -match 'title="Last Page"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\"isLastPage\(\) \? null \: \\''0\\''\" class=\"ui-paginator-last', '<a tabindex="0" title="Last Page" [attr.tabindex]="isLastPage() ? null : \''0\''" class="ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js.map

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js.map
}

$jsCode = Get-Content node_modules\primeng\paginator\primeng-paginator.metadata.json

if (-not ($jsCode -match 'title=\"Last Page\"')) {
    $jsCode -replace '\<a \[attr\.tabindex\]\=\\\"isLastPage\(\) \? null \: ''0''\\\" class=\\\"ui-paginator-last', '<a tabindex=\"0\" title=\"Last Page\" [attr.tabindex]=\"isLastPage() ? null : ''0''\" class=\"ui-paginator-last'| Out-File -encoding ASCII node_modules\primeng\paginator\primeng-paginator.metadata.json
}





$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js
}

$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.js.map

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.js.map
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js

if (-not ($jsCode -match '\[title\]="pageLink-1 == getPage\(\) \? \\''Page \\''')) {
    $jsCode -replace '\<a tabindex=\"0\" \*ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page', '<a tabindex="0" [title]="pageLink-1 == getPage() ? \''Page \'' + pageLink + \'': Current Page\'' : \''Page \'' + pageLink + \'' Link\''" *ngFor="let pageLink of pageLinks" class="ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js
}


$jsCode = Get-Content node_modules\primeng\bundles\primeng-paginator.umd.min.js.map

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\bundles\primeng-paginator.umd.min.js.map
}

$jsCode = Get-Content node_modules\primeng\paginator\primeng-paginator.metadata.json

if (-not ($jsCode -match '\[title\]=\\\"pageLink-1 == getPage\(\) \? ''Page ''')) {
    $jsCode -replace '\<a tabindex=\\\"0\\\" \*ngFor=\\\"let pageLink of pageLinks\\\" class=\\\"ui-paginator-page', '<a tabindex=\"0\" [title]=\"pageLink-1 == getPage() ? ''Page '' + pageLink + '': Current Page'' : ''Page '' + pageLink + '' Link''\" *ngFor=\"let pageLink of pageLinks\" class=\"ui-paginator-page'| Out-File -encoding ASCII node_modules\primeng\paginator\primeng-paginator.metadata.json
}