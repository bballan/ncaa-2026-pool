import numpy as np
import pandas as pd
import csv


scenarios = pd.read_csv("critgames8_WB.csv")
picks = pd.read_csv("picks2019worldsbest.csv")

winner = picks['Bracket Name'].tolist()
#winner = ['PODD!','Boz2', 'Boz1']
podium = [1,1.5,2,2.5,3,3.5,4,4.5,36,36.5,37,37.5,38]

columns = scenarios.columns[1:16].tolist() #15 games remaining
outputcols = ['Entry', 'Finishing Position'] + columns

with open('critical_path_WB8.csv', 'wb') as csvfile:
	output = outputcols
	wr = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)
	wr.writerow(output)
	#outputframe = pd.DataFrame()

	for place in podium:		
		for w in winner:
			row = []
			subset = []
			subset = scenarios[scenarios[w] == place]
			#print w
			#print len(subset['EE1'])
			row.append(w)
			row.append(place)
			#print subset.iloc[:,1:16]
			for i, c in enumerate(subset.iloc[:,1:16].columns):
				try:
					#print c
					#print subset[c].value_counts()[0]
					#print subset.index
					if subset[c].value_counts()[0] == len(subset.index):
						row.append(subset[c].value_counts().index[0])
						#print "--%s---" % c
						#print subset[c].value_counts().index[0]						
					else:
						row.append(' ')
				except IndexError:
					pass
				finally:
					pass

			#print row
			wr.writerow(row)

csvfile.close()